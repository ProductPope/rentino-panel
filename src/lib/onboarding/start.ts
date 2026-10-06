import { equipmentTotals, type EquipmentItem } from "./equipment"
import { settingsSummary } from "./settings"
import type { OnboardingStatus } from "./types"

/** The booking page's address: "Bikes Mallorca" → "bikesmallorca.rentino.app". */
export function bookingDomain(accountName: string) {
  const slug = accountName
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
  return `${slug || "your-business"}.rentino.app`
}

/** "BM" for "Bikes Mallorca". */
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("")

/** What the booking page shows: the customer's own items (demo examples were dropped on approve). */
export function bookingPreviewItems(items: EquipmentItem[]) {
  return items
    .filter((i) => !i.demo)
    .map((i) => ({ id: i.id, name: i.name, photoUrl: i.photoUrl, pricePerDay: i.pricePerDay }))
}

export type SetupArea = "equipment" | "settings"

/** "What we set up for you": one row per area, each with the step that changes it. */
export function setupRows(status: OnboardingStatus, items: EquipmentItem[]) {
  const totals = equipmentTotals(items)
  const summary = settingsSummary(status.settings)
  const equipment =
    totals.items > 0
      ? `${totals.items} ${totals.items === 1 ? "item" : "items"} · ${totals.units} ${totals.units === 1 ? "unit" : "units"}`
      : `${status.draft.categories} categories · ${status.draft.units} units`
  return [
    { label: equipment, area: "equipment" as SetupArea },
    { label: summary.payments, area: "settings" as SetupArea },
    { label: summary.delivery, area: "settings" as SetupArea },
    { label: summary.taxes, area: "settings" as SetupArea },
    { label: summary.signature, area: "settings" as SetupArea },
  ]
}
