# Screens

One page per screen. New screen → copy [the template](./_template.md) into the folder that matches
its route, link it from that folder's README (the link order is the menu order); `pnpm lint:docs`
checks both.

**Status**: _prototype_ — built and tested on mock data · _stand-in_ — a placeholder for something
outside this app · _planned_ — "Soon" in the sidebar.

The docs follow the panel's navigation — folders mirror routes (`screens/welcome/setup/…` documents
`/welcome/setup/…`), and the site's menu is built from `src/config/navigation.tsx`.

| Screen                                                       | Route                      | Status    |
| ------------------------------------------------------------ | -------------------------- | --------- |
| [Panel shell and navigation](./app-shell/README.md)          | every page in the panel    | prototype |
| [Welcome](./welcome/README.md)                               | `/welcome` (`/` redirects) | prototype |
| ↳ [Setup wizard](./welcome/setup/README.md)                  | `/welcome/setup/…`         | prototype |
| ↳ ↳ [1 · Your details](./welcome/setup/sources.md)           | `/welcome/setup/sources`   | prototype |
| ↳ ↳ [2 · Preparing](./welcome/setup/progress.md)             | `/welcome/setup/progress`  | prototype |
| ↳ ↳ [3 · Equipment and prices](./welcome/setup/equipment.md) | `/welcome/setup/equipment` | prototype |
| ↳ ↳ [4 · Settings](./welcome/setup/settings.md)              | `/welcome/setup/settings`  | prototype |
| ↳ ↳ [5 · Start](./welcome/setup/start.md)                    | `/welcome/setup/start`     | prototype |
| [Settings](./settings/README.md)                             | `/settings/…`              | —         |
| ↳ [Discount codes](./settings/discount-codes/README.md)      | `/settings/discount-codes` | prototype |
| [Booking page](./booking-page.md)                            | `/booking-page`            | stand-in  |
| [Docs site](./docs-site.md)                                  | `/docs/…`                  | prototype |

Planned (sidebar "Soon"): Dashboard, Calendar, Orders, Customers, Equipment, Transport, Service, and
most of Settings — they show as "Soon" in the docs menu too.

The onboarding flow is on the [Setup wizard](./welcome/setup/README.md) page.
