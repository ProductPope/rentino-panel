---
nav: Mock data and states
---

# Discount codes — mock data and states

How to open every state of [Discount codes](./README.md) without a backend. How mocks work in
general: [Mock data](../../../mock-data.md).

## States by URL

| URL                                   | Shows                                         |
| ------------------------------------- | --------------------------------------------- |
| `/settings/discount-codes`            | 7 demo codes, one of each status              |
| `/settings/discount-codes?mock=empty` | No codes yet: the empty state                 |
| `/settings/discount-codes?mock=error` | Loading fails: the error state with Try again |
| `/settings/discount-codes?mock=reset` | Back to the 7 demo codes                      |

**No access**: sign in as the demo user without "Manage discount codes" — see
[demo users](../../app-shell/mock-data.md#demo-users-the-mock_user-cookie).

## Stored data

| `localStorage` key            | What                                  | Seed                                                    |
| ----------------------------- | ------------------------------------- | ------------------------------------------------------- |
| `rentino.mock.discount-codes` | Discount codes                        | 7 codes covering every status (dates relative to today) |
| `rentino.mock.audit-log`      | Audit entries written on every change | empty                                                   |

## Simulated behaviour

The mock does what a backend would (see the [backend suggestion](./backend.md)): it rejects a
duplicate code, won't change the text of a used code or delete it, and writes an audit entry for
every change. Mock: `src/mocks/discount-codes.ts` (tests: `src/mocks/discount-codes.test.ts`).
