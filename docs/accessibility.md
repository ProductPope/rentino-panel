# Accessibility

**WCAG 2.2 level AA is a requirement**, in light and dark mode. A change that breaks a check doesn't
merge. The base components come accessible from EQ-librium; what this app adds (composition, copy,
focus handling) is tested here.

## What CI checks on every route

Every route and state is listed in `e2e/helpers.ts` → `PAGES`. For each one:

| Check                                        | Test                                             |
| -------------------------------------------- | ------------------------------------------------ |
| axe, WCAG 2.2 A/AA tags, light and dark      | `e2e/a11y.spec.ts`                               |
| Visible focus on every Tab stop, both themes | `e2e/keyboard.spec.ts` (pixels change around it) |
| No keyboard trap (Tab / Shift+Tab)           | `e2e/keyboard.spec.ts` (on Discount codes)       |
| Reflow at 320 CSS px, no page scroll         | `e2e/wcag.spec.ts`                               |
| Text spacing (WCAG values) doesn't clip      | `e2e/wcag.spec.ts`                               |
| One `h1` per page                            | `e2e/wcag.spec.ts`                               |

Open overlays — panels, dialogs, menus, select lists — get their own axe run in the screen's spec
(e.g. `axe with a unit open`, `axe on other settings, with the field list open`).

## Adding a screen

1. Add each route and each state (`?mock=…`) to `PAGES` with a readable name.
2. In the screen's spec: an axe run for every overlay it opens, in both themes, and tests for any
   keyboard pattern it adds (arrow keys, Escape, focus return).
3. Run `pnpm build && pnpm test:e2e`.

## Patterns this app relies on

- **Form errors** sit at the field (`FormField` → `aria-invalid`, `aria-describedby`, `role="alert"`).
  On save, focus goes to the first invalid field. If that field is hidden — a collapsed panel
  section, another tab, a collapsed unit — it is opened first (see setup step 3).
- **Links that open a new tab** (the booking page) say so: an external-link icon and
  "(opens in a new tab)" for screen readers.
- **Icon-only buttons** are `IconButton` with a `label` (tooltip + accessible name).
- **Feedback**: a result → toast (with Undo when reversible); a lasting condition → `Alert`; before a
  destructive action → `ConfirmDialog`.
- **Loading** regions have `aria-busy="true"` and a visually hidden "Loading …" text.
- **Language**: text in another language gets `lang` (and `dir="rtl"` for Arabic) — see the
  description tabs in setup step 3.
- **Target size** (2.5.8): small controls (switches) need room around them; see
  [Decisions](./decisions.md).

## Before calling a screen done

Automated checks catch a lot, not everything. Do a quick manual pass: keyboard only, a screen reader
(VoiceOver or NVDA) on the main flow, and 200% / 400% browser zoom.
