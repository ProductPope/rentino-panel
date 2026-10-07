---
title: Screen name
routes: [/path]
status: prototype # prototype | stand-in | planned
---

# Screen name

One sentence: who uses it and what for.

![Screen name](../img/<name>.jpg)

## Getting there

How a user reaches it (menu, a button on another screen) and where it leads next.

## States

| State   | How to see it         | What shows |
| ------- | --------------------- | ---------- |
| Loading | slow network / reload | …          |
| Ready   | `/path`               | …          |
| Empty   | `/path?mock=empty`    | …          |
| Error   | `/path?mock=error`    | …          |

## What the user can do

- Action → result (toast, panel, dialog, navigation).

## Rules and validation

Point to the functions and their tests rather than restating them:
`src/lib/<domain>/<file>.ts` → `functionName` (tests: `<file>.test.ts`).

## Data

Service methods the screen calls, and when. Link the [backend page](../backend/README.md).

## Components

- From EQ-librium: `PageHeader`, `EditPanel`, …
- App: `src/components/app/<area>/<file>.tsx`

## Accessibility

Anything beyond the standard checks: focus handling, live regions, keyboard patterns.

## Tests

`e2e/<area>.spec.ts` — what it covers.

## Open questions

Link to [Decisions](../decisions.md#open) for anything waiting on product.
