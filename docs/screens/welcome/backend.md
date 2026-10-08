---
nav: Billing
---

# Billing — backend

Interface: `BillingService` in `src/lib/billing/types.ts`. Mock: `src/mocks/billing.ts`. Screen:
[Welcome](../screens/welcome/README.md) (trial bar, plans dialog).

## Data

`Subscription`: `trialStartedAt` (ISO), `trialDays` (30), `plan?` (`{ id, period }`, set once a paid
plan is chosen). Plans (`PLANS` in `src/lib/billing/rules.ts`): Plan A, B, C, Unlimited (price on
request), with branches and logins per plan.

## Operations

| Method                   | Suggested endpoint            | Notes                                                                                  |
| ------------------------ | ----------------------------- | -------------------------------------------------------------------------------------- |
| `getSubscription()`      | `GET /subscription`           |                                                                                        |
| `choosePlan(id, period)` | `POST /subscription/checkout` | In the product: a payment checkout (e.g. Stripe), then the plan is set. Simulated here |

## Rules

- Days left: `trialStatus` (whole days, never below 0). The trial bar shows until a plan is chosen
  (`showsTrial`).
- Annual billing is 20% off, rounded down to whole units (`monthlyPrice`, `annualTotal`).
- **Prices are placeholders** — the plan list, prices and limits should come from the server (or a
  billing provider) rather than the frontend constants. See [Decisions](../decisions.md#open).
