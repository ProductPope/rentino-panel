---
nav: Mock data and states
---

# Welcome — mock data and states

How to open every state of [Welcome](./README.md) without a backend. How mocks work in general:
[Mock data](../../mock-data.md).

## Onboarding states (A–D)

Welcome shows the same onboarding status as the setup wizard — the states and their parameters are
on the [wizard's mock data page](./setup/mock-data.md). On Welcome:

| URL                             | Shows                                          |
| ------------------------------- | ---------------------------------------------- |
| `/welcome`                      | A — new visitor (or whatever is stored)        |
| `/welcome?mock=processing`      | B — preparing                                  |
| `/welcome?mock=processing-long` | B — preparing, ready in a few hours            |
| `/welcome?mock=draft-ready`     | C — draft ready                                |
| `/welcome?mock=imported`        | D — imported                                   |
| `/welcome?mock=imported-paid`   | D — settings and payments done                 |
| `/welcome?mock=error`           | Loading fails                                  |
| `/welcome?mock=reset`           | Back to state A (onboarding, equipment, trial) |

## Trial and plans

| URL                          | Shows                             |
| ---------------------------- | --------------------------------- |
| `/welcome`                   | Trial running: 21 of 30 days left |
| `/welcome?mock=trial-ending` | Trial bar: 3 days left            |
| `/welcome?mock=trial-ended`  | Trial bar: the trial has ended    |

| `localStorage` key     | What                       | Seed                                   |
| ---------------------- | -------------------------- | -------------------------------------- |
| `rentino.mock.billing` | Subscription (trial, plan) | A 30-day trial that started 9 days ago |

Choosing a plan in the dialog is simulated: it stores the plan and the trial bar disappears. Mock:
`src/mocks/billing.ts`.
