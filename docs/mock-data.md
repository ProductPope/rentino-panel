---
nav: Mock data
---

# Mock data

There is no backend: every service is a mock behind a typed interface
([Architecture](./architecture.md)). This page explains the mechanism; **each feature lists its own
states and data next to its screens**:

- [Welcome](./screens/welcome/mock-data.md) — onboarding states, trial and plans
- [Onboarding wizard](./screens/welcome/setup/mock-data.md) — states A–D, demo equipment, simulated
  preparation
- [Discount codes](./screens/settings/discount-codes/mock-data.md) — empty, error, the audit log
- [Panel shell](./screens/app-shell/mock-data.md) — demo users and permissions

## How it works

- **States by URL — `?mock=…`.** Add the parameter to a page's URL to force a state (empty, error, a
  stage of onboarding…). It only changes what the mocks return; nothing else reads it. Every state is
  linkable, e.g. on the online prototype.
- **Data persists per browser** in `localStorage` under `rentino.mock.*`, so changes survive a reload.
  On the online prototype every visitor has their own copy.
- **`?mock=reset`** clears the stored data of the page's services.
- **Demo users** are picked by the `mock_user` cookie.
- **Latency**: every call waits ~350 ms (`delay()` in `src/mocks/scenario.ts`) so loading states are
  visible.
- **Errors and rules**: mocks reject what a backend would, with the same typed errors the UI handles.

## Starting over completely

In DevTools → Application → Local Storage, delete the `rentino.mock.*` keys, or run in the console:

```js
Object.keys(localStorage)
  .filter((k) => k.startsWith("rentino.mock."))
  .forEach((k) => localStorage.removeItem(k))
```

## Adding a scenario or stored data

1. Add the value to the service's mock in `src/mocks/` (and to the comment listing its scenarios at
   the top of the file).
2. Describe it on the feature's **Mock data and states** page (`docs/screens/<feature>/mock-data.md`).
3. If it's a state worth testing, add it to `e2e/helpers.ts` `PAGES`.

`pnpm lint:docs` fails while a `?mock=` scenario or `rentino.mock.*` key isn't on a feature page.
