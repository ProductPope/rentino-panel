---
nav: Backend (suggestions)
---

# Backend — general suggestions

> **This is a suggestion, not a specification.** I don't know the real Rentino backend or its
> documentation. This page describes what the prototype's screens expect and one way a backend could
> provide it. Endpoints, payloads, error formats and rules here are proposals to check against the
> real product before anything is built on them.

What is fixed is the **TypeScript interface** each screen depends on; how a backend implements it —
endpoints, storage, transport — is the backend team's call. Each feature has its own page with the
details, next to its screens:

- [Welcome: trial and plans](./screens/welcome/backend.md)
- [Onboarding wizard](./screens/welcome/setup/backend.md)
- [Discount codes](./screens/settings/discount-codes/backend.md)
- [Session, permissions and audit log](./screens/app-shell/backend.md)

## How the frontend connects

Each domain has an interface in `src/lib/<domain>/types.ts` and one line in
`src/lib/<domain>/index.ts` that picks the implementation:

```ts
export const discountCodeRepository: DiscountCodeRepository = mockDiscountCodeRepository
```

Connecting a backend = an **adapter** that implements the same interface (HTTP calls, mapping
responses to the domain types and errors to the domain error class), and changing that line. The
mock (`src/mocks/<domain>.ts`) is the reference implementation: it shows every rule a backend would
need to enforce, and its tests (`src/mocks/*.test.ts`) are a checklist.

| Domain                          | Interface                    | Feature page (suggestion)                                      |
| ------------------------------- | ---------------------------- | -------------------------------------------------------------- |
| Onboarding                      | `OnboardingService`          | [Onboarding wizard](./screens/welcome/setup/backend.md)        |
| Billing                         | `BillingService`             | [Welcome: trial and plans](./screens/welcome/backend.md)       |
| Discount codes                  | `DiscountCodeRepository`     | [Discount codes](./screens/settings/discount-codes/backend.md) |
| Session, permissions, audit log | `SessionService`, `AuditLog` | [Panel shell](./screens/app-shell/backend.md)                  |

## Principles

1. **The server should enforce every rule.** Frontend validation is there for quick feedback; the same rules
   should hold on the server (uniqueness, ranges, "a used code can't be deleted"). The rules are pure
   functions in `src/lib/<domain>/` with tests — use them as the specification.
2. **Errors carry a reason.** Each domain has a small set of reasons (`DiscountCodeError`,
   `OnboardingError`). Suggested error body:

   ```json
   { "reason": "duplicate_code", "message": "A code “WINTER” already exists.", "field": "code" }
   ```

   The UI shows `message` and, when `field` is set, puts it at that field. Unknown failures map to
   `unavailable` ("The server didn't respond. Try again.").

3. **Everything belongs to a tenant** (the rental business). Uniqueness is per tenant (discount codes,
   unit codes, booking page addresses).
4. **Permissions are checked on every call**, not only by hiding UI. See [Panel shell](./screens/app-shell/backend.md).
5. **Every change is audited**: who, what, on which object, when. See [Panel shell](./screens/app-shell/backend.md).
6. **Derived values are computed, not stored** — e.g. a discount code's status follows from `active`
   and its dates; the server returns the raw fields and may add the derived ones.

## Money, dates and locale

- **Money**: the UI types use numbers in the tenant currency's main unit (`35` = $35.00). Store and
  send exact values (minor units or decimals) and convert in the adapter — never floats in storage.
- **Currency and locale** are tenant settings (`src/lib/tenant`, mocked as USD / en-US).
- **Date-only fields** (validity, price rule dates) are `YYYY-MM-DD` in the tenant's local time,
  inclusive. **Timestamps** are ISO 8601 in UTC (`createdAt`, `updatedAt`, `trialStartedAt`).

## Identifiers, lists, concurrency

- IDs are opaque strings; the UI never parses them.
- Lists are loaded whole today (small sets). For large ones, add paging/filtering on the server —
  the search and filter rules (`matchesQuery`, `statusOf`) say what to match.
- Suggested: reject a stale update with `409` when `updatedAt` doesn't match (two people editing).

## Files

Photos (equipment, units) are data URLs under 1 MB in the prototype, because there's nowhere to
upload them. The backend should offer an upload that returns a URL; the item then stores the URL
(`photoUrl`). Same for the price list file in setup step 1.
