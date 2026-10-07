# Rentino panel — documentation

A clickable prototype of the Rentino admin panel, built on the
[EQ-librium](https://eq-librium.vercel.app/docs) design system. **There is no backend**: everything a
backend would provide is mocked behind typed interfaces. These docs are for frontend developers, who
take the screens and the interfaces from here. They also carry guidelines for whoever builds the
backend.

Read them on the site, <https://rentino-panel.vercel.app/docs>, or here on GitHub — it's the same
Markdown ([how the site works](./screens/docs-site.md)). Docs grow with the panel: every new screen
gets its own page (see [Adding a screen](#adding-a-screen)).

## Contents

| Page                                      | What's in it                                                                    |
| ----------------------------------------- | ------------------------------------------------------------------------------- |
| [Getting started](./getting-started.md)   | Run it, the stack, the folders, the rules every change follows                  |
| [Architecture](./architecture.md)         | UI → typed interfaces → mocks; where business rules live; how a mock is swapped |
| [Mock data and states](./mock-data.md)    | `?mock=` scenarios, demo users, demo data, starting over                        |
| [Screens](./screens/README.md)            | One page per screen: purpose, states, components, rules, screenshots            |
| [Backend guidelines](./backend/README.md) | What each service must provide and enforce — a proposal, not a decided API      |
| [Accessibility](./accessibility.md)       | WCAG 2.2 AA: what is tested and how to test a new screen                        |
| [Deployment](./deployment.md)             | The online prototype on Vercel                                                  |
| [Decisions](./decisions.md)               | Why things are the way they are                                                 |
| [EQ-librium gaps](./eq-librium-gaps.md)   | What the design system lacks, and the stand-in used here                        |

Project conventions (for people and for Claude Code sessions) are in [CLAUDE.md](../CLAUDE.md); CI
rules in [.github/CI.md](../.github/CI.md).

## Where the truth is

The code is the specification; the docs explain it and point to it.

- **Types and service interfaces** (`src/lib/<domain>/types.ts`) — the data and the operations.
- **Business rules** (`src/lib/<domain>/*.ts`) — pure functions with unit tests (`*.test.ts`); the
  tests are the examples.
- **Behaviour** — Playwright tests in `e2e/` describe what a user can do on each screen, including
  keyboard and screen reader behaviour.

When the docs and the code disagree, the code wins — and the docs get fixed in the same PR.

## Keeping the docs current

Docs are updated **in the same PR as the change**, not afterwards:

| When a PR…                                         | …it also updates                                                  |
| -------------------------------------------------- | ----------------------------------------------------------------- |
| adds a route or screen                             | a new `docs/screens/<name>.md` + the [index](./screens/README.md) |
| changes what a screen shows or does                | that screen's page (and its screenshot: `pnpm docs:screens`)      |
| adds or changes a service method, error or rule    | [backend guidelines](./backend/README.md) for that domain         |
| adds a `?mock=` scenario, demo user or storage key | [mock data](./mock-data.md)                                       |
| makes a product or design decision                 | [decisions](./decisions.md)                                       |
| works around something missing in EQ-librium       | [EQ-librium gaps](./eq-librium-gaps.md)                           |

`pnpm lint:docs` (run in CI) fails when a route has no screen page, a screen page isn't in the index,
a mock scenario, storage key, service or permission is undocumented, or a link is broken. The PR
template has a docs checkbox for what a script can't check: that the words are still true.

## Adding a screen

1. Copy [`screens/_template.md`](./screens/_template.md) into the folder that mirrors the screen's
   route (`/settings/users` → `screens/settings/users.md`; a screen with sub-pages gets a folder and
   a `README.md`), fill it in, set `routes:` (and a short `nav:` label if the title is long).
2. Link it from its folder's `README.md` — the order of those links is the order in the docs menu —
   and add a row to [`screens/README.md`](./screens/README.md). If the screen is in the panel's
   sidebar, the menu picks it up from `src/config/navigation.tsx` by its route.
3. Add its states to `scripts/docs/screens.spec.ts`, run `pnpm build && pnpm docs:screens`, commit the
   images in `docs/img/`.
4. If it has a service: a page in `docs/backend/`.
5. `pnpm lint:docs`.
