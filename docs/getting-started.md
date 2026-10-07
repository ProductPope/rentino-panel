# Getting started

## Run it

Node ≥ 22 and pnpm (the version is pinned in `package.json`, `corepack enable` picks it up).

```bash
pnpm install
pnpm dev                       # http://localhost:3000 → redirects to /welcome
```

Checks — the same as CI (see [.github/CI.md](../.github/CI.md)):

```bash
pnpm lint && pnpm lint:tokens && pnpm lint:docs && pnpm format:check && pnpm typecheck && pnpm test
pnpm build && pnpm test:e2e    # Playwright + axe, against the production build
./scripts/check-registry.sh    # components still match the @eq registry
pnpm docs:screens              # after pnpm build: refresh the screenshots in docs/img/
```

To see a screen in a given state, add `?mock=…` to the URL — every state is listed in
[Mock data and states](./mock-data.md). `?mock=reset` starts over.

## Stack

Next.js (App Router, v16) · React 19 · TypeScript strict (+ `noUncheckedIndexedAccess`) · Tailwind v4 ·
Base UI (via shadcn `base-vega`) · lucide-react · Vitest · Playwright + @axe-core/playwright · ESLint
(next + jsx-a11y strict) · Prettier.

> This Next.js version differs from older ones. Read the guide in `node_modules/next/dist/docs/`
> before relying on an API you remember (see [AGENTS.md](../AGENTS.md)).

## Folders

```
src/
  app/                    routes (App Router). (admin)/ = pages inside the panel shell
  components/
    ui/, eq/              FROM THE @eq REGISTRY — never edit (CI checks for drift)
    app/<area>/           this app's screens and composites, built from ui/ and eq/
  config/navigation.tsx   sidebar items and route constants (…_HREF)
  lib/<domain>/           types, service interface, business rules (+ tests); index.ts wires the mock
  mocks/                  mock implementations; only src/lib/<domain>/index.ts imports them
e2e/                      Playwright tests; helpers.ts lists every route (PAGES)
scripts/                  checks (tokens, docs, registry) and the docs screenshot script
docs/                     this documentation
```

## Rules every change follows

The full list is in [CLAUDE.md](../CLAUDE.md). The ones that matter most day to day:

- **UI only from EQ-librium.** Install with `pnpm dlx shadcn@latest add @eq/<name> --overwrite`. If
  something is missing or wrong, it is a change to EQ-librium, not a local workaround — note it in
  [EQ-librium gaps](./eq-librium-gaps.md).
- **Semantic tokens only** (`bg-primary`, `text-muted-foreground`). No hex, no Tailwind palette
  (`pnpm lint:tokens`). Icon-only buttons are `IconButton` with a `label`.
- **UI imports interfaces from `src/lib/**`, never `src/mocks/**`** (ESLint enforces it).
- **WCAG 2.2 AA** — every route is in `e2e/helpers.ts` → `PAGES` and gets axe, keyboard and reflow
  checks. See [Accessibility](./accessibility.md).
- **English** for code, UI copy and docs.
- **Docs in the same PR** — see [Keeping the docs current](./README.md#keeping-the-docs-current).
