#!/usr/bin/env bash
# Tests for ci-decide.sh: a throwaway git repo and a fake `gh` that answers from JSON fixtures
# (filtered with jq, as `gh api --jq` would). Run: .github/scripts/ci-decide.test.sh
set -euo pipefail

SCRIPT="$(cd "$(dirname "$0")" && pwd)/ci-decide.sh"
command -v jq >/dev/null || { echo "jq is required" >&2; exit 1; }

WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
FIX="$WORK/fixtures"
mkdir -p "$WORK/bin" "$FIX" "$WORK/repo"

# Fake gh: `gh api <endpoint> --jq <filter>` → fixture JSON through jq. Every call is logged.
# A missing fixture file or $FIX/fail-<kind> makes the call fail, like an API error.
cat >"$WORK/bin/gh" <<'GH'
#!/usr/bin/env bash
echo "$*" >>"$FIX/calls"
[ "$1" = api ] || exit 9
endpoint=$2 filter=.
[ "${3:-}" = --jq ] && filter=$4
case "$endpoint" in
  */actions/artifacts\?*) kind=artifacts ;;
  */actions/runs/*) kind="run-${endpoint##*/}" ;;
  *) exit 9 ;;
esac
[ -e "$FIX/fail-$kind" ] && { echo "HTTP 502" >&2; exit 1; }
[ -f "$FIX/$kind.json" ] || { echo "HTTP 404" >&2; exit 1; }
jq -r "$filter" "$FIX/$kind.json"
GH
chmod +x "$WORK/bin/gh"
export PATH="$WORK/bin:$PATH" FIX

export GIT_AUTHOR_NAME=t GIT_AUTHOR_EMAIL=t@t GIT_COMMITTER_NAME=t GIT_COMMITTER_EMAIL=t@t
export GITHUB_REPOSITORY=o/r WORKFLOW_PATH=.github/workflows/ci.yml
export E2E_IGNORE_RE='^(docs/|legacy/|\.changeset/|[^/]+\.md$)'
export REGISTRY_RE='^(src/components/(ui|eq)/|src/hooks/|src/lib/utils\.ts$|components\.json$)'
unset GITHUB_OUTPUT

cd "$WORK/repo"
git init -q -b main
mkdir -p src/app docs
echo a >src/app/page.tsx
echo a >README.md
git add -A && git commit -qm base

fails=0
check() { # check <name> <expected line> <actual output>
  if grep -qxF -- "$2" <<<"$3"; then echo "ok   $1: $2"; else
    echo "FAIL $1: expected '$2' in:"; awk '{ print "       " $0 }' <<<"$3"; fails=$((fails + 1)); fi
}
# commit_files <path>... — a new commit on top of base touching these files
commit_files() {
  git reset -q --hard "$(git rev-list --max-parents=0 HEAD)"
  for f in "$@"; do mkdir -p "$(dirname "$f")"; echo "$RANDOM" >>"$f"; done
  git add -A && git commit -qm change
}
run() { EVENT_NAME=$1 "$SCRIPT" "$2" 2>&1; }

echo "== scope"
commit_files README.md docs/plan/x.md
o=$(run pull_request scope); check "docs-only PR" e2e=false "$o"; check "docs-only PR" registry=false "$o"
commit_files CLAUDE.md .changeset/a.md legacy/v0.2/x.tsx
o=$(run pull_request scope); check "root md + changeset + legacy" e2e=false "$o"
commit_files src/app/README.md
o=$(run pull_request scope); check "nested .md is not ignored" e2e=true "$o"
commit_files README.md src/app/page.tsx
o=$(run pull_request scope); check "docs + code" e2e=true "$o"; check "docs + code" registry=false "$o"
commit_files .github/workflows/ci.yml
o=$(run pull_request scope); check "workflow change runs e2e" e2e=true "$o"
commit_files src/components/ui/button.tsx
o=$(run pull_request scope); check "registry path on PR" registry=true "$o"; check "registry path on PR" e2e=true "$o"
o=$(run push scope); check "registry path on push (main never runs drift)" registry=false "$o"
commit_files components.json
o=$(run pull_request scope); check "components.json" registry=true "$o"
o=$(run workflow_dispatch scope); check "manual run" e2e=true "$o"; check "manual run" registry=true "$o"
o=$(run schedule scope); check "schedule" e2e=true "$o"
o=$(REGISTRY_RE='' EVENT_NAME=workflow_dispatch "$SCRIPT" scope 2>&1); check "no REGISTRY_RE" registry=false "$o"

echo "== scope: no parent (shallow / root commit)"
git reset -q --hard "$(git rev-list --max-parents=0 HEAD)"
o=$(run pull_request scope); check "root commit → full" e2e=true "$o"

echo "== scope: merge commit diffs against the first parent"
git checkout -q -b feature
mkdir -p docs; echo b >>docs/new.md; git add -A; git commit -qm docs
git checkout -q main
echo b >>src/app/page.tsx; git add -A; git commit -qm code-on-main
git merge -q --no-ff -m "Merge feature" feature
o=$(run push scope); check "merge of a docs-only branch" e2e=false "$o"

echo "== reuse"
TREE=$(git rev-parse 'HEAD^{tree}')
artifacts() { # artifacts <run id>... [expired:<run id>]
  local items="" id expired
  for id in "$@"; do
    expired=false; [[ $id == expired:* ]] && { expired=true; id=${id#expired:}; }
    items+="${items:+,}{\"name\":\"ci-tree-$TREE\",\"expired\":$expired,\"workflow_run\":{\"id\":$id}}"
  done
  echo "{\"total_count\":$#,\"artifacts\":[${items}]}" >"$FIX/artifacts.json"
}
runjson() { # runjson <id> <path> <event> <conclusion|null>
  local c=$4; [ "$c" = null ] || c="\"$c\""
  echo "{\"id\":$1,\"path\":\"$2\",\"event\":\"$3\",\"conclusion\":$c}" >"$FIX/run-$1.json"
}
reset_fix() { rm -f "$FIX"/*; }

reset_fix; artifacts 11; runjson 11 .github/workflows/ci.yml pull_request success
o=$(run push reuse); check "green PR artifact" reuse=true "$o"; check "green PR artifact" reused_run=11 "$o"
check "tree output" "tree=$TREE" "$o"

reset_fix; artifacts 12; runjson 12 .github/workflows/ci.yml@refs/pull/3/merge pull_request success
o=$(run push reuse); check "path with @ref" reuse=true "$o"

reset_fix; artifacts 13; runjson 13 .github/workflows/ci.yml pull_request failure
o=$(run push reuse); check "red PR run" reuse=false "$o"

reset_fix; artifacts 14; runjson 14 .github/workflows/ci.yml pull_request null
o=$(run push reuse); check "PR run still in progress" reuse=false "$o"

reset_fix; artifacts 15; runjson 15 .github/workflows/ci.yml push success
o=$(run push reuse); check "artifact from a push run" reuse=false "$o"

reset_fix; artifacts 16; runjson 16 .github/workflows/other.yml pull_request success
o=$(run push reuse); check "artifact from another workflow" reuse=false "$o"

reset_fix; artifacts expired:17; runjson 17 .github/workflows/ci.yml pull_request success
o=$(run push reuse); check "expired artifact" reuse=false "$o"

reset_fix; artifacts 18 19; runjson 18 .github/workflows/ci.yml pull_request failure
runjson 19 .github/workflows/ci.yml pull_request success
o=$(run push reuse); check "red then green attempt" reuse=true "$o"; check "red then green attempt" reused_run=19 "$o"

reset_fix; echo '{"total_count":0,"artifacts":[]}' >"$FIX/artifacts.json"
o=$(run push reuse); check "no artifact" reuse=false "$o"

reset_fix; touch "$FIX/fail-artifacts"
o=$(run push reuse); check "artifacts API error" reuse=false "$o"

reset_fix; artifacts 20 21; touch "$FIX/fail-run-20"; runjson 21 .github/workflows/ci.yml pull_request success
o=$(run push reuse); check "runs API error on one run, next is green" reuse=true "$o"

reset_fix; artifacts 22; touch "$FIX/fail-run-22"
o=$(run push reuse); check "runs API error only" reuse=false "$o"

reset_fix; artifacts 11; runjson 11 .github/workflows/ci.yml pull_request success
o=$(run workflow_dispatch reuse); check "manual run never reuses" reuse=false "$o"
o=$(run pull_request reuse); check "pull_request never reuses" reuse=false "$o"
if [ -e "$FIX/calls" ]; then echo "FAIL manual/PR runs must not call the API"; fails=$((fails + 1)); else
  echo "ok   manual/PR runs make no API call"; fi

echo "== GITHUB_OUTPUT"
reset_fix; artifacts 11; runjson 11 .github/workflows/ci.yml pull_request success
GITHUB_OUTPUT="$WORK/out" EVENT_NAME=push "$SCRIPT" reuse >/dev/null 2>&1
check "written to GITHUB_OUTPUT" reuse=true "$(cat "$WORK/out")"

echo "== usage"
if "$SCRIPT" bogus >/dev/null 2>&1; then echo "FAIL unknown command must exit non-zero"; fails=$((fails + 1)); else
  echo "ok   unknown command exits non-zero"; fi

echo
if [ "$fails" -gt 0 ]; then echo "$fails failure(s)"; exit 1; fi
echo "all passed"
