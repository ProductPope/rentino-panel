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
  /** Optional: the category this equipment sits under (Bikes, Kayaks, …). */
  parentCategory?: string
  units: number
  /** Unit codes start with it: "BIK" → BIK-001, BIK-002, … */
  codePrefix: string
  /** Rental rates (per hour, packages, daily, nightly, weekly, monthly) and dynamic pricing rules. */
  pricing: Pricing
  /** Thumbnail URL (or a data URL of a photo the customer picked). */
  photoUrl?: string
  /** Units with their own code, name or photo; the others use the item's. */
  unitOverrides?: UnitOverride[]
  /** An example on demo data: shown to start from, never saved by approving. */
  demo?: boolean
}

/** What one unit (position 1…units) changes from its item. Empty fields fall back to the item. */
export interface UnitOverride {
  position: number
  code?: string
  name?: string
  photoUrl?: string
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
export const UNIT_CODE_MAX_LENGTH = 20
export const NAME_MAX_LENGTH = 80
export const PREFIX_MAX_LENGTH = 6

/** The suggested code prefix of a parent category ("" for none or an unknown one). */
export const prefixFor = (category: string) =>
  EQUIPMENT_CATEGORIES.find((c) => c.label === category)?.prefix ?? ""

/** Code prefixes are capitals and digits only. */
export const normalizePrefix = (value: string) =>
  value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, PREFIX_MAX_LENGTH)

/** A unit's own code: capitals, digits and "-", e.g. a serial or frame number. */
export const normalizeUnitCode = (value: string) =>
  value
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, UNIT_CODE_MAX_LENGTH)

export interface UnitOverrideDraft {
  position: number
  code: string
  name: string
  photoUrl?: string
}

/** What the form holds: strings, as typed. */
export interface EquipmentDraft {
  name: string
  /** "" = no parent category. */
  parentCategory: string
  units: string
  codePrefix: string
  pricing: PricingDraft
  photoUrl?: string
  unitOverrides: UnitOverrideDraft[]
}

/** Errors by field: `name`, `units`, … and pricing paths such as `daily.0.price`, `rules.1.value`. */
export type EquipmentErrors = Record<string, string>

export function toEquipmentDraft(item?: EquipmentItem): EquipmentDraft {
  if (!item)
    return {
      name: "",
      parentCategory: "",
      units: "1",
      codePrefix: "",
      pricing: newPricingDraft(),
      unitOverrides: [],
    }
  return {
    name: item.name,
    parentCategory: item.parentCategory ?? "",
    units: String(item.units),
    codePrefix: item.codePrefix,
    pricing: toPricingDraft(item.pricing),
    photoUrl: item.photoUrl,
    unitOverrides: (item.unitOverrides ?? []).map((o) => ({
      position: o.position,
      code: o.code ?? "",
      name: o.name ?? "",
      photoUrl: o.photoUrl,
    })),
  }
}

/** Whether an override changes anything. */
const changes = (o: UnitOverrideDraft) => Boolean(o.code.trim() || o.name.trim() || o.photoUrl)

/**
 * Checks the item, its units and its price list. `options.firstNumber` is where this item's
 * default unit codes start; `options.takenCodes` are the unit codes of every other item.
 */
export function validateEquipment(
  draft: EquipmentDraft,
  options: { firstNumber?: number; takenCodes?: Set<string> } = {}
): EquipmentErrors {
  const errors: EquipmentErrors = {}
  if (!draft.name.trim()) errors.name = "Enter a name."
  else if (draft.name.trim().length > NAME_MAX_LENGTH)
    errors.name = `Use at most ${NAME_MAX_LENGTH} characters.`
  const units = Number(draft.units)
  const unitsValid = /^\d+$/.test(draft.units.trim()) && units >= 1 && units <= UNITS_MAX
  if (!unitsValid) errors.units = `Enter a whole number from 1 to ${UNITS_MAX}.`
  if (draft.codePrefix.length < 2) errors.codePrefix = "Use 2–6 letters or digits, e.g. BIK."
  if (unitsValid && draft.codePrefix.length >= 2) {
    const seen = new Map<string, number>()
    for (const unit of draftUnits(draft, options.firstNumber ?? 1)) {
      const at = `unit.${unit.position}`
      if (unit.ownCode && !/^[A-Z0-9][A-Z0-9-]{1,}$/.test(unit.code))
        errors[`${at}.code`] = "Use 2–20 letters, digits or “-”."
      else if (seen.has(unit.code) || options.takenCodes?.has(unit.code))
        errors[`${at}.code`] = `${unit.code} is already used. Codes must be unique.`
      seen.set(unit.code, unit.position)
      if (unit.ownName && unit.name.length > NAME_MAX_LENGTH)
        errors[`${at}.name`] = `Use at most ${NAME_MAX_LENGTH} characters.`
    }
  }
  return { ...errors, ...validatePricing(draft.pricing) }
}

/** A valid draft as the input to save. Call only when `validateEquipment` returns no errors. */
export function toEquipmentInput(draft: EquipmentDraft): EquipmentInput {
  const units = Number(draft.units)
  const overrides = draft.unitOverrides
    .filter((o) => o.position <= units && changes(o))
    .sort((a, b) => a.position - b.position)
    .map((o) => ({
      position: o.position,
      ...(o.code.trim() ? { code: o.code.trim() } : {}),
      ...(o.name.trim() ? { name: o.name.trim() } : {}),
      ...(o.photoUrl ? { photoUrl: o.photoUrl } : {}),
    }))
  return {
    name: draft.name.trim(),
    ...(draft.parentCategory ? { parentCategory: draft.parentCategory } : {}),
    units,
    codePrefix: draft.codePrefix,
    pricing: toPricing(draft.pricing),
    ...(draft.photoUrl ? { photoUrl: draft.photoUrl } : {}),
    ...(overrides.length ? { unitOverrides: overrides } : {}),
  }
}

export const unitCode = (prefix: string, n: number) => `${prefix}-${String(n).padStart(3, "0")}`
const code = unitCode

/** A unit as shown: its own code, name and photo, or the item's. */
export interface Unit {
  position: number
  code: string
  defaultCode: string
  name: string
  photoUrl?: string
  ownCode: boolean
  ownName: boolean
  ownPhoto: boolean
}

/** Where an item's default unit numbers start: after earlier items with the same prefix. */
export function firstNumber(
  itemsBefore: Pick<EquipmentItem, "units" | "codePrefix">[],
  prefix: string
) {
  return 1 + itemsBefore.filter((i) => i.codePrefix === prefix).reduce((n, i) => n + i.units, 0)
}

/** Every unit of an item, overrides applied; a unit without a photo shows the item's. */
export function unitsOf(
  item: Pick<EquipmentItem, "name" | "units" | "codePrefix" | "photoUrl" | "unitOverrides">,
  first: number
): Unit[] {
  const byPosition = new Map((item.unitOverrides ?? []).map((o) => [o.position, o]))
  return Array.from({ length: item.units }, (_, i) => {
    const position = i + 1
    const o = byPosition.get(position)
    const defaultCode = code(item.codePrefix, first + i)
    return {
      position,
      code: o?.code || defaultCode,
      defaultCode,
      name: o?.name || item.name,
      photoUrl: o?.photoUrl || item.photoUrl,
      ownCode: Boolean(o?.code),
      ownName: Boolean(o?.name),
      ownPhoto: Boolean(o?.photoUrl),
    }
  })
}

/** The units of a form draft (the panel's live preview), with what the customer typed. */
export function draftUnits(draft: EquipmentDraft, first: number): Unit[] {
  const units = Number(draft.units)
  if (!Number.isInteger(units) || units < 1) return []
  return unitsOf(
    {
      name: draft.name.trim() || "This equipment",
      units: Math.min(units, UNITS_MAX),
      codePrefix: draft.codePrefix,
      photoUrl: draft.photoUrl,
      unitOverrides: draft.unitOverrides.map((o) => ({
        position: o.position,
        code: o.code.trim() || undefined,
        name: o.name.trim() || undefined,
        photoUrl: o.photoUrl,
      })),
    },
    first
  )
}

/** Units of every item, in list order (default numbers continue per prefix). */
export function unitsByItem(items: EquipmentItem[]) {
  const result = new Map<string, Unit[]>()
  items.forEach((item, i) => {
    result.set(item.id, unitsOf(item, firstNumber(items.slice(0, i), item.codePrefix)))
  })
  return result
}

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
    // Items without a parent category count as their own category.
    categories: new Set(own.map((i) => i.parentCategory ?? `item:${i.id}`)).size,
    demo: items.length - own.length,
  }
}
