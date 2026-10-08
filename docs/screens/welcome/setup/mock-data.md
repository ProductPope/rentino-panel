---
nav: Mock data and states
---

# Onboarding wizard — mock data and states

How to open every state of the [setup wizard](./README.md) (and of [Welcome](../README.md), which
follows the same onboarding status) without a backend. How mocks work in general:
[Mock data](../../../mock-data.md).

## States by URL

| URL                                            | Shows                                                                     |
| ---------------------------------------------- | ------------------------------------------------------------------------- |
| `/welcome/setup/sources`                       | Step 1 for a new account (state A — nothing sent)                         |
| `/welcome/setup/progress?mock=processing`      | B — we're preparing the draft from the price list                         |
| `/welcome/setup/progress?mock=processing-long` | B — a large price list: ready in a few hours, "ready by HH:MM"            |
| `/welcome/setup/progress?mock=draft-ready`     | C — the draft waits for review                                            |
| `/welcome/setup/equipment`                     | Step 3 with the three demo items                                          |
| `/welcome/setup/settings?mock=imported`        | D — imported; settings not finished, payments not connected               |
| `/welcome/setup/start?mock=imported-settings`  | D — settings finished                                                     |
| `/welcome/setup/start?mock=imported-paid`      | D — settings finished and payments connected                              |
| `…?mock=error` (steps 2, 4, 5)                 | Loading the status fails: the error state                                 |
| `…?mock=reset`                                 | Clears onboarding and equipment data: back to state A with the demo items |

Forced states (`?mock=processing` … `?mock=imported-paid`) count as the current state while the
parameter is in the URL; saving in step 4 works in them too. Without a parameter the stored state is
used.

## Stored data

| `localStorage` key        | What                                                  | Seed                                                                             |
| ------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------- |
| `rentino.mock.onboarding` | Onboarding status: stage, account, settings, payments | State A, account "Bikes Mallorca"                                                |
| `rentino.mock.equipment`  | Equipment added in step 3                             | 3 demo items: Trek Marlin 7 Mountain Bike, Club Car Tempo, Wilson Pro Staff RF97 |

Equipment saved by older versions of the prototype is migrated when read (`category` →
`parentCategory`, single prices → price lists).

## Simulated behaviour

- Sending a price list in step 1 starts a simulated preparation: one processing step every ~1.1 s,
  the draft is ready after ~15 s (`simulatedProgress` in `src/mocks/onboarding.ts`).
- Approving in step 3 needs at least one item of the customer's own; it drops the demo items and
  moves the account to state D.
- Step 4 can't be saved without a confirmed VAT rate (the mock rejects it like a backend would).
- Connecting payments in step 5 is simulated — it just marks payments as connected.
- Photos (equipment, units) are stored as data URLs under 1 MB.

Mock: `src/mocks/onboarding.ts` (tests: `src/mocks/onboarding.test.ts`).
