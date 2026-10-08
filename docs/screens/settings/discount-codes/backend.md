---
nav: Backend (suggestion)
---

# Discount codes — backend (suggestion)

> **This is a suggestion, not a specification.** I don't know the real Rentino backend or its
> documentation. This page describes what the prototype's screens expect and one way a backend could
> provide it. Endpoints, payloads, error formats and rules here are proposals to check against the
> real product before anything is built on them.

Interface: `DiscountCodeRepository` in `src/lib/discount-codes/types.ts`. Mock:
`src/mocks/discount-codes.ts` (tests: `discount-codes.test.ts`). Screen:
[Settings → Discount codes](./README.md). Jira: WHLZ-566.

## Data

`DiscountCode`: `id`, `code`, `type` (`percentage` | `fixed`), `value`, `validFrom?`, `validTo?`
(`YYYY-MM-DD`, inclusive), `active`, `description?` (internal note), `uses` (read-only: orders that
used it), `createdAt`, `updatedAt`.

## Operations

| Method                  | Suggested endpoint                      | Notes                                       |
| ----------------------- | --------------------------------------- | ------------------------------------------- |
| `list()`                | `GET /discount-codes`                   | All codes of the tenant, newest first       |
| `create(input)`         | `POST /discount-codes`                  | `uses = 0`; returns the created code        |
| `update(id, input)`     | `PUT /discount-codes/{id}`              | Returns the updated code                    |
| `setActive(id, active)` | `PATCH /discount-codes/{id}` `{active}` | Returns the updated code; used for Undo too |
| `remove(id)`            | `DELETE /discount-codes/{id}`           | Only unused codes                           |

## Rules a backend would need to enforce (suggested)

- `code`: A–Z, 0–9, `-`, `_`; stored uppercase; ≤ 32 characters; **unique per tenant,
  case-insensitive** → `duplicate_code`.
- `value`: percentage 0.01–100, fixed amount > 0, at most 2 decimals.
- `validTo` not before `validFrom`; both optional (no dates = never expires).
- A code **used on an order** (`uses > 0`) can't change its `code` and can't be deleted → `in_use`;
  it can only be deactivated.
- At checkout (outside this panel): a code applies only when `statusOf(code) === "active"` on the
  order date.
- Every change writes an audit entry: Created / Edited / Activated / Deactivated / Deleted,
  subject "Discount code X".

## Errors

`DiscountCodeError.reason`: `not_found` (deleted meanwhile), `in_use`, `duplicate_code`,
`unavailable`.

## Permission

All operations need `discount_codes.manage` (see the [session suggestion](../../app-shell/backend.md)).
