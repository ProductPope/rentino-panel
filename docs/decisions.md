# Decisions

Why things are the way they are. Newest first within each area; add an entry when you decide
something a newcomer would otherwise ask about. **Open** items wait for a product decision.

## Open

| Question                                                            | Current stand-in                                                  |
| ------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Plan prices (Plan A / B / C)                                        | $49 / $99 / $199 a month, annual −20% rounded down ($39/$79/$159) |
| Review of a prepared draft (Welcome C, "Review and approve")        | Not built; the button says it's coming soon                       |
| Order of description languages in setup step 3                      | English first (the panel is in English), then as in Rentino       |
| Managing custom fields (pencil next to the custom field pickers)    | A message that it's managed in Settings, which isn't built yet    |
| Copy of the "shows on your booking page once…" note in setup step 3 | Adapted from Rentino's category note to equipment                 |

## Whole app

- **No backend, now or in this work.** It's a clickable prototype for frontend developers; every
  backend concern is a typed interface with a mock ([Architecture](./architecture.md)).
- **English** for UI copy, code and docs; **Rentino** branding.
- **Welcome is the first page**: `/` redirects to `/welcome`; other sections are "Soon" in the
  sidebar until they ship.
- **The booking page is a separate site**: every link to it opens in a new tab and says so.
- **UI only from EQ-librium.** Missing pieces get a stand-in from what exists, listed in
  [EQ-librium gaps](./eq-librium-gaps.md) — no local components that imitate the design system.

## Setup wizard

- **Full screen, outside the panel shell**, with "Step N of 5 · Name" (no stepper in EQ) and a close
  button back to Welcome. Each step can be left and resumed from Welcome.
- **Step 1 offers two sources**: enter equipment by hand, or upload a price list file (no website
  address). A file goes to step 2 (we prepare a draft); by hand goes straight to step 3.
- **Step 3 (by hand) looks like the draft review**: one collapsible row per item with its price list,
  edited in a side panel (`EditPanel`).
  - Three **demo items** (Trek Marlin 7, Club Car Tempo, Wilson Pro Staff RF97) with a "Demo data"
    badge. They're never saved by approving; editing one makes it the customer's own.
  - **Rows start collapsed**; in the panel **only the first section is open**. A save with errors
    opens every section that has one, so focus can reach the field.
  - **Parent category is optional.** The **unit code prefix** defaults to the first five letters or
    digits of the name and follows the name until the customer types their own.
  - **Units** can each override the code, the name and the photo; a unit without a photo shows the
    equipment photo. Unit codes are unique across all equipment.
  - **Price lists**: rate kinds in tabs (per hour, hourly packages, daily, nightly, weekly, monthly)
    and dynamic pricing rules by date range or days of the week, per item.
  - **Other settings** follow Rentino's "online booking settings": shown on the booking page or not,
    the item's address (unique), a description per language, custom description and checkout fields.
  - **Photos are kept as data URLs under 1 MB**, because there is nowhere to upload them.
- **Step 4 asks to confirm the VAT rate** every time: tax is the customer's responsibility.

## Welcome

- States **A–D** follow the onboarding stage (sent nothing / preparing / draft ready / imported).
- **Trial bar** with "Upgrade to Premium" opening the plans dialog; hidden once a plan is chosen.
- **No progress bar** (not in EQ): a step counter "0/3" instead.

## Accessibility

- A **Switch right under a section heading needs space** above it (WCAG 2.5.8 target size): the
  "Other settings" section has top padding for it.
