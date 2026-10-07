# EQ-librium gaps

What this app needed and the design system doesn't have (yet). The rule: **no local component that
imitates the design system** — use the closest thing EQ has, note it here, and propose the real thing
to [EQ-librium](https://github.com/ProductPope/EQ-librium) separately. When EQ ships it, replace the
stand-in and remove the row.

| Needed             | Where                                  | Stand-in used                                             | Proposal for EQ                                  |
| ------------------ | -------------------------------------- | --------------------------------------------------------- | ------------------------------------------------ |
| Stepper            | Setup wizard header                    | Text "Step N of 5 · Name"                                 | `Stepper` (horizontal, with current/done states) |
| Progress bar       | Welcome checklist, setup step 2        | Counter "0/3" (`StepCounter`), list of steps with spinner | `Progress` (determinate, labelled)               |
| File dropzone      | Setup step 1 (price list), unit photos | `Input type="file"`                                       | `FileDropzone` (drag & drop, file list, errors)  |
| Segmented control  | Setup step 4 (pay in full / deposit)   | `RadioGroup`                                              | `SegmentedControl`                               |
| "Demo" tone        | Demo badges                            | `Badge variant="info"`                                    | A neutral-accent tone for sample data            |
| Public page tokens | Booking page preview (setup step 5)    | Panel tokens                                              | Tokens for customer-facing pages                 |

Also check `./scripts/check-registry.sh` after an EQ release: it reinstalls every `@eq` item and fails
when the installed copy differs. A weekly CI job runs it too.
