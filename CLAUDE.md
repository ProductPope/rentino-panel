@AGENTS.md

# rentino-panel — repo conventions

Rentino admin panel, built section by section. First live section: **Settings → Discount codes**
(Jira epic WHLZ-566). Every other navigation item is `comingSoon` until it ships.

## UI wyłącznie z rejestru @eq (EQ-librium); reguły w EQ-librium/CLAUDE.md

- Design system: [ProductPope/EQ-librium](https://github.com/ProductPope/EQ-librium) —
  docs https://eq-librium.vercel.app/docs, registry `@eq` → `https://eq-librium.vercel.app/r/{name}.json`.
- Install: `pnpm dlx shadcn@latest add @eq/<name> --overwrite`. Base components land in
  `src/components/ui/`, composites in `src/components/eq/`.
- **Never edit** `src/components/ui/`, `src/components/eq/`, `src/hooks/`, `src/lib/utils.ts` or the
  token block of `src/app/globals.css`. If something is missing or wrong, describe it as a change to
  EQ-librium (separately) — don't work around it locally. `scripts/check-registry.sh` (CI) fails on drift.
- Only semantic tokens (`bg-primary`, `text-muted-foreground`, …). No hex, no Tailwind palette, no
  colour literals — `pnpm lint:tokens` enforces it. Icons: `lucide-react`. Icon-only buttons only as
  `IconButton` with a `label`.
- App-specific composition lives in `src/components/app/`.

## Accessibility — WCAG 2.2 AA is a requirement

Labels, visible focus, full keyboard support, errors at the field, both themes. A change that breaks a
check does not merge. Every route is listed in `e2e/helpers.ts` (`PAGES`) and gets: axe (WCAG 2.2 A/AA) in
light and dark, focus-visible on every Tab stop, no keyboard trap, reflow at 320px, text spacing, one h1.
Open overlays (menus, sheets, panels, dialogs) get their own axe run.

## No backend

There is no backend integration, now or planned for this work. Everything a backend would provide is
mocked behind a typed interface: the UI imports the interface (`src/lib/**`), never `src/mocks/**`.
The only place a mock is wired in is the service module (e.g. `src/lib/session/index.ts`).

- Business rules live in `src/lib/<domain>/` as pure functions with unit tests (Vitest); the mock
  enforces what a backend would (e.g. a used discount code can't be deleted) and writes Logs.
- Mock data persists in `localStorage` (`rentino.mock.*`). `?mock=empty`, `?mock=error`, `?mock=reset`
  force a state; the `mock_user=staff` cookie signs in a user without "Manage discount codes".

## Stack and commands

Next.js (App Router) · React 19 · TypeScript strict (+ `noUncheckedIndexedAccess`) · Tailwind v4 · pnpm ·
Node ≥ 22 · ESLint (next + jsx-a11y strict) · Prettier · Playwright + @axe-core/playwright.

```bash
pnpm install
pnpm dev                      # http://localhost:3000
pnpm lint && pnpm lint:tokens && pnpm format:check && pnpm typecheck && pnpm test
pnpm build && pnpm test:e2e   # e2e runs against the production build
./scripts/check-registry.sh   # components still match @eq
```

## Working agreements

- Small steps, logical commits, a summary after each stage. One PR per stage.
- **Merge on green CI — standing approval.** When every check on the PR's latest commit is green and
  there is no merge conflict, merge it (merge commit) without waiting for a separate go-ahead.
- Code, UI copy and docs in English.
