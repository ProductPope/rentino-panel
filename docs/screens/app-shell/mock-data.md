---
nav: Mock data and states
---

# Panel shell — mock data and states

How mocks work in general: [Mock data](../../mock-data.md).

## Demo users: the `mock_user` cookie

| Cookie            | User                      | Permissions                             |
| ----------------- | ------------------------- | --------------------------------------- |
| none (default)    | Anna Nowak, Owner, Kraków | `discount_codes.manage`                 |
| `mock_user=staff` | Piotr Zieliński, Staff    | none — Discount codes shows "no access" |

In the browser console: `document.cookie = "mock_user=staff; path=/"`, then reload. Remove it with
`document.cookie = "mock_user=; path=/; max-age=0"`. Mock: `src/mocks/session.ts`.

## Sidebar

The sidebar remembers whether it is collapsed in the `sidebar_state` cookie. "Sign out" only shows a
message — there is no sign-in in the prototype.
