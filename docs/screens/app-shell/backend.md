---
nav: Backend (suggestion)
---

# Session, permissions and audit log — backend (suggestion)

> **This is a suggestion, not a specification.** I don't know the real Rentino backend or its
> documentation. This page describes what the prototype's screens expect and one way a backend could
> provide it. Endpoints, payloads, error formats and rules here are proposals to check against the
> real product before anything is built on them.

## Session

Interface: `SessionService` in `src/lib/session/types.ts` — **server only** (`import "server-only"`).
Mock: `src/mocks/session.ts` (demo users picked by the `mock_user` cookie).

| Method         | Notes                                                               |
| -------------- | ------------------------------------------------------------------- |
| `getSession()` | The signed-in user: id, name, email, role name, branch, permissions |
| `signOut()`    | Ends the session                                                    |

The admin layout and pages call it on the server (Next.js server components), so the real
implementation can read the auth cookie or token directly. Sign-in itself isn't in the prototype.

## Permissions

`Permission` is a string union in `src/lib/session/types.ts`; `can(user, permission)` checks it.
Permissions are granted per role (Settings → Roles, not built yet).

| Permission              | Allows                                   | Checked in                                         |
| ----------------------- | ---------------------------------------- | -------------------------------------------------- |
| `discount_codes.manage` | See and change Settings → Discount codes | `src/app/(admin)/settings/discount-codes/page.tsx` |

The UI hides what the user can't do and explains why; **a backend should reject the same calls**
(`403`). Add each new permission to the union, this table and the screen that checks it.

## Audit log

Interface: `AuditLog` in `src/lib/audit-log/index.ts` — `record({ actor, action, subject })` and
`list()`. Mock: `src/mocks/audit-log.ts`. Entries feed Settings → Logs (not built yet).

- In the product the **server writes the entry** as part of the change (same transaction), with the
  actor from the session — not the client. The mocks write it only to show which changes are
  audited.
- `action`: past tense verb ("Created", "Deactivated"); `subject`: the object as people read it
  ("Discount code WINTERSALE"); `at`: ISO timestamp.

## Tenant

`src/lib/tenant` holds the tenant's currency and locale (mocked: USD, en-US) used for formatting. In
the product they come with the session or account settings.
