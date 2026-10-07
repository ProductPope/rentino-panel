# CI and GitHub Actions minutes

The repo is private on the GitHub Free plan: **2,000 Actions minutes a month**, shared by every
private repo of the account, and **every job is billed rounded up to a full minute**. When the pool
runs out, jobs fail without logs — on `main` too. Usage: GitHub → Settings → Billing → Usage
(product _Actions_). There is no deploy job in Actions.

## Workflows

| Workflow           | When                                   | What                                                                                           |
| ------------------ | -------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `ci.yml` (one job) | PR (not draft), push to `main`, manual | lint, tokens, docs, format, typecheck, unit, decision-script tests, build, E2E, registry drift |
| `registry.yml`     | weekly (Mon 06:17 UTC), manual         | `scripts/check-registry.sh` — catches new EQ-librium releases                                  |

## What CI skips, and the fallback

Decisions live in `.github/scripts/ci-decide.sh` (tests: `ci-decide.test.sh`, run in CI). Anything
uncertain — no parent commit, a git or API error, an unexpected event — means a **full run**. A manual
run (`workflow_dispatch`) is always a full run.

1. **Push to `main` reuses the PR result.** A green PR run uploads an artifact
   `ci-tree-<tree hash of GitHub's merge commit>` (14 days). The push to `main` after merging (merge
   commit) has the same tree if `main` did not move in between; it looks the artifact up
   (`actions/artifacts?name=…`, run from `.github/workflows/ci.yml`, event `pull_request`, conclusion
   `success`) and, if found, skips every other step. Not found → full run.
2. **E2E only when the diff can affect it.** `git diff HEAD^1 HEAD` (on a PR checkout HEAD is the merge
   commit, HEAD^1 the base). When every changed file matches `E2E_IGNORE_RE` — root `*.md`, `docs/**`,
   `.changeset/**` — Playwright is not installed and E2E does not run. Lint, format, typecheck, unit
   tests and the build always run.
3. **Registry drift** runs in the CI job on PRs whose diff touches `src/components/{ui,eq}`,
   `src/hooks`, `src/lib/utils.ts` or `components.json`, and weekly. Never on `main` pushes.
4. **Draft PRs get no CI.** It starts on _Ready for review_.
5. `concurrency` cancels a running CI when a newer commit is pushed to the same ref, and every job has
   `timeout-minutes`.

Changing the rules: edit the script and its tests together, run
`.github/scripts/ci-decide.test.sh`, `shellcheck .github/scripts/*.sh` and `actionlint`
(`pip install shellcheck-py actionlint-py`). The same script lives in EQ-librium — keep them in step.

## Dependabot

Not configured. If added: `interval: monthly` and one group per ecosystem — every Dependabot PR is a
full CI run.
