## What

<!-- What changes for the user, and why. Screenshots for UI changes. -->

## Checks

- [ ] `pnpm lint && pnpm lint:tokens && pnpm lint:docs && pnpm format:check && pnpm typecheck && pnpm test`
- [ ] `pnpm build && pnpm test:e2e` — new routes and states are in `e2e/helpers.ts` `PAGES`, overlays have an axe run

## Docs (what to update: `docs/README.md` → "Keeping the docs current")

- [ ] Screen pages in `docs/screens/` describe what the screen does now (screenshots refreshed if it looks different)
- [ ] `docs/backend/`, `docs/mock-data.md`, `docs/decisions.md`, `docs/eq-librium-gaps.md` updated where this PR touches them
- [ ] Nothing to update — this PR doesn't change behaviour
