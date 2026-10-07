---
title: Booking page (stand-in)
routes: [/booking-page]
status: stand-in
---

# Booking page (stand-in)

The tenant's **public booking page** — where their customers search and book — is a separate site,
not part of this panel. `/booking-page` only stands in for it, so links from the panel lead
somewhere.

## Links to it

All open in a **new tab** and say so (external-link icon, "(opens in a new tab)" for screen readers):

- Sidebar → **View booking page**
- Welcome → "View your booking page" step (**Open page**), and in state D **View booking page with
  your data**
- Setup 5 → preview → **Open page**
- Setup 3 → panel → Other settings → **See it live**

Use `BOOKING_PAGE_HREF` from `src/config/navigation.tsx`. In the product these become the tenant's
real address (`https://<business>.rentino.app`, and `/product/<slug>` for an item — see
`bookingDomain` and `productUrlBase` in `src/lib/onboarding/`).

## Files

`src/app/booking-page/page.tsx`.

## Tests

`e2e/keyboard.spec.ts` and `e2e/welcome.spec.ts` (opens in a new tab, says so); axe via `PAGES`.
