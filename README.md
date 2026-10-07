# Rentino panel

A clickable prototype of the Rentino admin panel for frontend developers. The UI comes only from the
[EQ-librium](https://eq-librium.vercel.app/docs) design system (`@eq` shadcn registry). **There is no
backend**: data and session are mocked behind typed interfaces.

- **Online prototype**: <https://rentino-panel.vercel.app> (starts at `/welcome`)
- **Documentation**: <https://rentino-panel.vercel.app/docs>, or [docs/](./docs/README.md) here —
  screens, mock states, architecture, backend guidelines

## What's in it

| Screen                                                                  | Route                      |
| ----------------------------------------------------------------------- | -------------------------- |
| [Welcome](./docs/screens/welcome.md) (onboarding A–D, trial, plans)     | `/welcome`                 |
| [Setup wizard](./docs/screens/README.md#the-onboarding-flow), steps 1–5 | `/welcome/setup/*`         |
| [Settings → Discount codes](./docs/screens/discount-codes.md)           | `/settings/discount-codes` |

Every state can be opened by URL, e.g. `/welcome?mock=draft-ready` —
[all of them](./docs/mock-data.md). `?mock=reset` starts over.

## Run it

```bash
pnpm install
pnpm dev                      # http://localhost:3000 → /welcome
pnpm lint && pnpm lint:tokens && pnpm lint:docs && pnpm format:check && pnpm typecheck && pnpm test
pnpm build && pnpm test:e2e   # Playwright + axe (WCAG 2.2 AA), against the production build
```

Conventions: [CLAUDE.md](./CLAUDE.md) · [Getting started](./docs/getting-started.md) ·
CI: [.github/CI.md](./.github/CI.md).
