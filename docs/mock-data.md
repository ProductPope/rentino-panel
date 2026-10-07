# Mock data and states

Every state a screen can be in can be opened by URL, so designers, developers and tests can see it
without a backend. Mock data is per browser (`localStorage`), so on the online prototype every
visitor has their own copy.

## Forcing a state: `?mock=`

Add the parameter to the page's URL. It only changes what the mocks return; nothing else reads it.

| Parameter                 | Where                                | Shows                                                       |
| ------------------------- | ------------------------------------ | ----------------------------------------------------------- |
| `?mock=reset`             | Welcome, setup, Discount codes       | Clears the stored data of the page's services; starts over  |
| `?mock=error`             | Welcome, setup 2/4/5, Discount codes | Loading fails: the error state ("Try again" or "Reload")    |
| `?mock=empty`             | Discount codes                       | No codes yet: the empty state                               |
| `?mock=processing`        | Welcome, setup step 2                | B — we're preparing the draft from the price list           |
| `?mock=processing-long`   | Welcome, setup step 2                | B — a large price list: ready in a few hours                |
| `?mock=draft-ready`       | Welcome, setup step 2                | C — the draft waits for review                              |
| `?mock=imported`          | Welcome, setup 4–5                   | D — imported; settings not finished, payments not connected |
| `?mock=imported-settings` | Welcome, setup 4–5                   | D — settings finished                                       |
| `?mock=imported-paid`     | Welcome, setup 4–5                   | D — settings finished and payments connected                |
| `?mock=trial-ending`      | Welcome                              | Trial bar: 3 days left                                      |
| `?mock=trial-ended`       | Welcome                              | Trial bar: the trial has ended                              |

Forced onboarding states (`processing` … `imported-paid`) count as the current state while the
parameter is in the URL; saving in step 4 works in them too. Without a parameter, the stored state is
used — a new visitor starts in state A.

## Demo users: the `mock_user` cookie

| Cookie            | User                      | Permissions                             |
| ----------------- | ------------------------- | --------------------------------------- |
| none (default)    | Anna Nowak, Owner, Kraków | `discount_codes.manage`                 |
| `mock_user=staff` | Piotr Zieliński, Staff    | none — Discount codes shows "no access" |

In the browser console: `document.cookie = "mock_user=staff; path=/"`, then reload. Remove it with
`document.cookie = "mock_user=; path=/; max-age=0"`.

## Stored data (`localStorage`)

| Key                           | What                                         | Seed                                                     |
| ----------------------------- | -------------------------------------------- | -------------------------------------------------------- |
| `rentino.mock.onboarding`     | Onboarding status (stage, account, settings) | State A, account "Bikes Mallorca"                        |
| `rentino.mock.equipment`      | Equipment added in setup step 3              | 3 demo items: Trek Marlin 7, Club Car Tempo, Wilson RF97 |
| `rentino.mock.discount-codes` | Discount codes                               | 7 codes covering every status (dates relative to today)  |
| `rentino.mock.billing`        | Subscription (trial, plan)                   | 30-day trial that started 9 days ago                     |
| `rentino.mock.audit-log`      | Audit entries written by the mocks           | empty                                                    |

Stored data from older versions of the prototype is migrated when read (e.g. equipment `category` →
`parentCategory`), so a returning visitor doesn't see a broken screen.

## Starting over

- One area: open its page with `?mock=reset` (e.g. `/welcome?mock=reset` resets onboarding and
  equipment).
- Everything: in DevTools → Application → Local Storage, delete the `rentino.mock.*` keys, or run
  `Object.keys(localStorage).filter(k => k.startsWith("rentino.mock.")).forEach(k => localStorage.removeItem(k))`
  in the console.

## Simulated behaviour

- Every call waits ~350 ms (`delay()` in `src/mocks/scenario.ts`) so loading states are visible.
- Sending a price list (setup step 1) starts a simulated preparation: one step every ~1.1 s, the
  draft is ready after ~15 s.
- Mocks return the same typed errors a backend would (`DiscountCodeError`, `OnboardingError`) and
  write audit entries for changes to discount codes.

## Adding a scenario

Add the value to the service's mock (and to the comment listing its scenarios at the top of the
file), add a row above, and — if it's a state worth testing — an entry in `e2e/helpers.ts` `PAGES`.
`pnpm lint:docs` fails while a scenario is missing here.
