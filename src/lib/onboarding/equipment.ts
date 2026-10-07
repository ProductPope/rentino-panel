import { formatMoney } from "@/lib/tenant"

import {
  newPricingDraft,
  startingPrice,
  toPricing,
  toPricingDraft,
  validatePricing,
  type Pricing,
  type PricingDraft,
} from "./pricing"

/**
 * Equipment the customer adds by hand in the setup wizard (step "Equipment and prices").
 * One item = one kind of equipment with N units; each unit gets a code (BIK-001, BIK-002, …).
 */
export interface EquipmentItem {
  id: string
  name: string
  category: string
  units: number
  /** Unit codes start with it: "BIK" → BIK-001, BIK-002, … */
  codePrefix: string
  /** Rental rates (per hour, packages, daily, nightly, weekly, monthly) and dynamic pricing rules. */
  pricing: Pricing
  /** Thumbnail URL (or a data URL of a photo the customer picked). */
  photoUrl?: string
  /** An example on demo data: shown to start from, never saved by approving. */
  demo?: boolean
}

export type EquipmentInput = Omit<EquipmentItem, "id" | "demo">

export const EQUIPMENT_CATEGORIES = [
  { label: "Bikes", prefix: "BIK" },
  { label: "E-bikes", prefix: "EBK" },
  { label: "Golf carts", prefix: "GLF" },
  { label: "Tennis rackets", prefix: "TNS" },
  { label: "Kayaks", prefix: "KAY" },
  { label: "Scooters", prefix: "SCO" },
  { label: "Other", prefix: "OTH" },
] as const

export const UNITS_MAX = 999
export const NAME_MAX_LENGTH = 80
export const PREFIX_MAX_LENGTH = 6

/** The suggested code prefix of a category ("" for an unknown one). */
export const prefixFor = (category: string) =>
  EQUIPMENT_CATEGORIES.find((c) => c.label === category)?.prefix ?? ""

/** Code prefixes are capitals and digits only. */
export const normalizePrefix = (value: string) =>
  value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, PREFIX_MAX_LENGTH)

/** What the form holds: strings, as typed. */
export interface EquipmentDraft {
  name: string
  category: string
  units: string
  codePrefix: string
  pricing: PricingDraft
  photoUrl?: string
}

/** Errors by field: `name`, `units`, … and pricing paths such as `daily.0.price`, `rules.1.value`. */
export type EquipmentErrors = Record<string, string>

export function toEquipmentDraft(item?: EquipmentItem): EquipmentDraft {
  if (!item)
    return { name: "", category: "", units: "1", codePrefix: "", pricing: newPricingDraft() }
  return {
    name: item.name,
    category: item.category,
    units: String(item.units),
    codePrefix: item.codePrefix,
    pricing: toPricingDraft(item.pricing),
    photoUrl: item.photoUrl,
  }
}

export function validateEquipment(draft: EquipmentDraft): EquipmentErrors {
  const errors: EquipmentErrors = {}
  if (!draft.name.trim()) errors.name = "Enter a name."
  else if (draft.name.trim().length > NAME_MAX_LENGTH)
    errors.name = `Use at most ${NAME_MAX_LENGTH} characters.`
  if (!draft.category) errors.category = "Choose a category."
  const units = Number(draft.units)
  if (!/^\d+$/.test(draft.units.trim()) || units < 1 || units > UNITS_MAX)
    errors.units = `Enter a whole number from 1 to ${UNITS_MAX}.`
  if (draft.codePrefix.length < 2) errors.codePrefix = "Use 2–6 letters or digits, e.g. BIK."
  return { ...errors, ...validatePricing(draft.pricing) }
}

/** A valid draft as the input to save. Call only when `validateEquipment` returns no errors. */
export function toEquipmentInput(draft: EquipmentDraft): EquipmentInput {
  return {
    name: draft.name.trim(),
    category: draft.category,
    units: Number(draft.units),
    codePrefix: draft.codePrefix,
    pricing: toPricing(draft.pricing),
    ...(draft.photoUrl ? { photoUrl: draft.photoUrl } : {}),
  }
}

const code = (prefix: string, n: number) => `${prefix}-${String(n).padStart(3, "0")}`

/**
 * Unit codes per item, numbered on from earlier items with the same prefix, in list order:
 * two "BIK" items of 2 units each get BIK-001…BIK-002 and BIK-003…BIK-004.
 */
export function assignCodes(items: Pick<EquipmentItem, "id" | "units" | "codePrefix">[]) {
  const next = new Map<string, number>()
  const codes = new Map<string, { first: string; last: string }>()
  for (const item of items) {
    const start = next.get(item.codePrefix) ?? 1
    codes.set(item.id, {
      first: code(item.codePrefix, start),
      last: code(item.codePrefix, start + item.units - 1),
    })
    next.set(item.codePrefix, start + item.units)
  }
  return codes
}

/** "BIK-001" for one unit, "BIK-001…BIK-014" for more. */
export const codeRange = (range: { first: string; last: string }) =>
  range.first === range.last ? range.first : `${range.first}…${range.last}`

/** "from $26.00 / day" — what the booking page shows for an item. */
export function fromPrice(item: Pick<EquipmentItem, "pricing">) {
  const start = startingPrice(item.pricing)
  return start ? `from ${formatMoney(start.amount)} ${start.suffix}` : "Price on request"
}

/** What approving saves: only the customer's own items, never the demo examples. */
export function equipmentTotals(items: EquipmentItem[]) {
  const own = items.filter((i) => !i.demo)
  return {
    items: own.length,
    units: own.reduce((sum, i) => sum + i.units, 0),
    categories: new Set(own.map((i) => i.category)).size,
    demo: items.length - own.length,
  }
}
