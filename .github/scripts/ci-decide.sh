#!/usr/bin/env bash
# CI decisions for .github/workflows/ci.yml — what may be skipped to save Actions minutes.
# Rule: any doubt (missing parent, git or API error, unexpected event) means a FULL run.
#
#   ci-decide.sh reuse   push only: is there a green pull_request run of this exact tree?
#                        → tree=<hash> reuse=true|false [reused_run=<run id>]
#   ci-decide.sh scope   what the diff against the base touches (git diff HEAD^1 HEAD; on a
#                        pull_request checkout HEAD is GitHub's merge commit, HEAD^1 the base)
#                        → e2e=true|false registry=true|false
#
# Environment:
#   EVENT_NAME          github.event_name
#   GITHUB_REPOSITORY   owner/repo (reuse)
#   WORKFLOW_PATH       e.g. .github/workflows/ci.yml (reuse: the PR run must come from it)
#   GH_TOKEN            token for `gh api` (reuse; needs actions: read)
#   E2E_IGNORE_RE       ERE; when every changed file matches it, e2e=false
#   REGISTRY_RE         ERE; registry=true when a changed file matches (pull_request only).
#                       Unset → registry=false.
#   GITHUB_OUTPUT       outputs are appended here (stdout when unset)
set -uo pipefail

out() {
  echo "$1=$2"
  if [ -n "${GITHUB_OUTPUT:-}" ]; then echo "$1=$2" >>"$GITHUB_OUTPUT"; fi
}
note() { echo "::notice::$*" >&2; }
warn() { echo "::warning::$*" >&2; }

reuse() {
  local tree name ids id info path event conclusion
  if ! tree=$(git rev-parse 'HEAD^{tree}' 2>/dev/null); then
    warn "reuse: cannot read the tree of HEAD — full run"
    out reuse false
    return
  fi
  out tree "$tree"
  if [ "${EVENT_NAME:-}" != "push" ]; then
    out reuse false
    return
  fi
  name="ci-tree-$tree"
  if ! ids=$(gh api "repos/${GITHUB_REPOSITORY}/actions/artifacts?name=${name}&per_page=100" \
    --jq '.artifacts[] | select(.expired | not) | .workflow_run.id'); then
    warn "reuse: artifacts API failed — full run"
    out reuse false
    return
  fi
  for id in $ids; do
    if ! info=$(gh api "repos/${GITHUB_REPOSITORY}/actions/runs/${id}" \
      --jq '[.path, .event, .conclusion // ""] | @tsv'); then
      warn "reuse: runs API failed for run $id — skipping that run"
      continue
    fi
    IFS=$'\t' read -r path event conclusion <<<"$info"
    path=${path%%@*}
    if [ "$path" = "${WORKFLOW_PATH:-}" ] && [ "$event" = "pull_request" ] &&
      [ "$conclusion" = "success" ]; then
      note "reuse: tree $tree passed in pull_request run $id — skipping the rest"
      out reuse true
      out reused_run "$id"
      return
    fi
  done
  note "reuse: no green pull_request run of tree $tree — full run"
  out reuse false
}

scope() {
  local files rest registry=false
  case "${EVENT_NAME:-}" in
    pull_request | push) ;;
    *)
      note "scope: ${EVENT_NAME:-unknown event} — full run"
      out e2e true
      out registry "$([ -n "${REGISTRY_RE:-}" ] && echo true || echo false)"
      return
      ;;
  esac
  if ! files=$(git diff --name-only HEAD^1 HEAD 2>/dev/null) || [ -z "$files" ]; then
    warn "scope: no diff against HEAD^1 (missing parent or empty) — full run"
    out e2e true
    out registry "$([ -n "${REGISTRY_RE:-}" ] && [ "$EVENT_NAME" = pull_request ] && echo true || echo false)"
    return
  fi
  if [ -n "${E2E_IGNORE_RE:-}" ]; then
    rest=$(grep -Ev -- "$E2E_IGNORE_RE" <<<"$files" || true)
  else
    rest=$files
  fi
  if [ -n "$rest" ]; then
    out e2e true
  else
    note "scope: only files matching E2E_IGNORE_RE changed — e2e not needed"
    out e2e false
  fi
  if [ -n "${REGISTRY_RE:-}" ] && [ "$EVENT_NAME" = pull_request ] &&
    grep -Eq -- "$REGISTRY_RE" <<<"$files"; then
    registry=true
  fi
  out registry "$registry"
}

case "${1:-}" in
  reuse) reuse ;;
  scope) scope ;;
  *)
    echo "usage: $0 reuse|scope" >&2
    exit 2
    ;;
esac
