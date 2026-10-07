import { formatMoney } from "@/lib/tenant"

/**
 * An item's price list, as in the Rentino equipment form: rental rates by kind (tabs) and
 * dynamic pricing rules. An item has only the kinds it uses; the rest stay empty.
 */
export interface Pricing {
  /** Hour tiers: from–to hours → price per hour. */
  hourly: RateTier[]
  /** Fixed packages: N hours for a price (e.g. 4 h, half a day). */
  packages: PackagePrice[]
  /** Day tiers: from–to days → price per day. */
  daily: RateTier[]
  /** One price for a night, or none. */
  nightly: number | null
  /** Week tiers: from–to weeks → price per week. */
  weekly: RateTier[]
  /** Month tiers: from–to months → price per month. */
  monthly: RateTier[]
  /** Dynamic pricing rules; they add up before the final price. */
  rules: PriceRule[]
}

export interface RateTier {
  id: string
  from: number
  /** `null` = "and more" (e.g. 7+ days). */
  to: number | null
  price: number
}

export interface PackagePrice {
  id: string
  hours: number
  price: number
}

export type RuleDateType = "range" | "weekdays"
export type RuleChange = "fixed" | "percent"

export interface PriceRule {
  id: string
  dateType: RuleDateType
  change: RuleChange
  /** Negative for a discount: -30 (%) or -5 (amount). */
  value: number
  /** `YYYY-MM-DD`, for a date range. */
  from?: string
  to?: string
  /** 0 = Sunday … 6 = Saturday, for days of the week. */
  weekdays?: number[]
  active: boolean
}

export type TierKind = "hourly" | "daily" | "weekly" | "monthly"
export type RateKind = TierKind | "packages" | "nightly"

/** Tabs in the order the Rentino form shows them. */
export const RATE_KINDS: { kind: RateKind; label: string }[] = [
  { kind: "hourly", label: "Per hour" },
  { kind: "packages", label: "Hourly packages" },
  { kind: "daily", label: "Daily" },
  { kind: "nightly", label: "Nightly" },
  { kind: "weekly", label: "Weekly" },
  { kind: "monthly", label: "Monthly" },
]

/** Unit of each tier kind: labels ("Day from"), summaries ("/ day"). */
export const TIER_UNIT: Record<TierKind, { singular: string; plural: string; label: string }> = {
  hourly: { singular: "hour", plural: "hours", label: "Hour" },
  daily: { singular: "day", plural: "days", label: "Day" },
  weekly: { singular: "week", plural: "weeks", label: "Week" },
  monthly: { singular: "month", plural: "months", label: "Month" },
}

export const WEEKDAYS = [
  { day: 1, short: "Mon", long: "Monday" },
  { day: 2, short: "Tue", long: "Tuesday" },
  { day: 3, short: "Wed", long: "Wednesday" },
  { day: 4, short: "Thu", long: "Thursday" },
  { day: 5, short: "Fri", long: "Friday" },
  { day: 6, short: "Sat", long: "Saturday" },
  { day: 0, short: "Sun", long: "Sunday" },
] as const

export const emptyPricing = (): Pricing => ({
  hourly: [],
  packages: [],
  daily: [],
  nightly: null,
  weekly: [],
  monthly: [],
  rules: [],
})

/** How many prices an item has of a kind (for tab counts). */
export function rateCount(pricing: Pricing, kind: RateKind) {
  if (kind === "nightly") return pricing.nightly == null ? 0 : 1
  return pricing[kind].length
}

export const hasAnyRate = (pricing: Pricing) =>
  RATE_KINDS.some((k) => rateCount(pricing, k.kind) > 0)

const min = (values: number[]) => (values.length ? Math.min(...values) : undefined)

/** The lowest price of a kind, or undefined when the item has none of it. */
export function lowestPrice(pricing: Pricing, kind: RateKind) {
  if (kind === "nightly") return pricing.nightly ?? undefined
  return min(pricing[kind].map((t) => t.price))
}

const KIND_SUFFIX: Record<RateKind, string> = {
  hourly: "/ hour",
  packages: "/ package",
  daily: "/ day",
  nightly: "/ night",
  weekly: "/ week",
  monthly: "/ month",
}

/** "from $8.00 / hour · from $26.00 / day · from $180.00 / week · 2 price rules" (first 3 kinds). */
export function pricingSummary(pricing: Pricing) {
  const kinds = RATE_KINDS.filter((k) => rateCount(pricing, k.kind) > 0)
  const parts = kinds.slice(0, 3).map(({ kind }) => {
    const price = formatMoney(lowestPrice(pricing, kind) ?? 0)
    const many = kind !== "nightly" && rateCount(pricing, kind) > 1
    return `${many ? "from " : ""}${price} ${KIND_SUFFIX[kind]}`
  })
  if (kinds.length > 3) parts.push(`+${kinds.length - 3} more`)
  const rules = pricing.rules.filter((r) => r.active).length
  if (rules > 0) parts.push(`${rules} price ${rules === 1 ? "rule" : "rules"}`)
  return parts.length ? parts.join(" · ") : "No prices yet"
}

/** What the booking page shows as "from …": the daily price first, else the first kind there is. */
export function startingPrice(pricing: Pricing) {
  const order: RateKind[] = ["daily", "hourly", "packages", "nightly", "weekly", "monthly"]
  for (const kind of order) {
    const amount = lowestPrice(pricing, kind)
    if (amount !== undefined) return { amount, suffix: KIND_SUFFIX[kind] }
  }
  return undefined
}

/** "1–2 days", "7+ days", "3 hours" */
export function tierRange(kind: TierKind, tier: Pick<RateTier, "from" | "to">) {
  const unit = TIER_UNIT[kind]
  if (tier.to == null) return `${tier.from}+ ${unit.plural}`
  if (tier.from === tier.to) return `${tier.from} ${tier.from === 1 ? unit.singular : unit.plural}`
  return `${tier.from}–${tier.to} ${unit.plural}`
}

const shortDate = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(`${iso}T00:00:00`)
  )

/** "+20% · Jun 1, 2027 – Aug 31, 2027", "-$5.00 · Sat, Sun" */
export function ruleSummary(rule: PriceRule) {
  const sign = rule.value > 0 ? "+" : rule.value < 0 ? "−" : ""
  const amount = Math.abs(rule.value)
  const change = rule.change === "percent" ? `${sign}${amount}%` : `${sign}${formatMoney(amount)}`
  const when =
    rule.dateType === "range"
      ? rule.from && rule.to
        ? `${shortDate(rule.from)} – ${shortDate(rule.to)}`
        : "no dates"
      : WEEKDAYS.filter((d) => rule.weekdays?.includes(d.day))
          .map((d) => d.short)
          .join(", ") || "no days"
  return `${change} · ${when}`
}

const isoOf = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Whether a rule applies on a day. Inactive rules never apply. */
export function ruleApplies(rule: PriceRule, date: Date) {
  if (!rule.active) return false
  if (rule.dateType === "weekdays") return rule.weekdays?.includes(date.getDay()) ?? false
  if (!rule.from || !rule.to) return false
  const day = isoOf(date)
  return rule.from <= day && day <= rule.to
}

/**
 * The price on a day after dynamic rules. Rules add up before the final price: +20% and −30% on
 * the same day make −10%; fixed amounts add up the same way. Never below 0.
 */
export function applyRules(price: number, rules: PriceRule[], date: Date) {
  let percent = 0
  let fixed = 0
  for (const rule of rules) {
    if (!ruleApplies(rule, date)) continue
    if (rule.change === "percent") percent += rule.value
    else fixed += rule.value
  }
  const result = price * (1 + percent / 100) + fixed
  return Math.max(0, Math.round(result * 100) / 100)
}

/* ---------- The form: strings as typed, errors per field ---------- */

export interface TierDraft {
  id: string
  from: string
  to: string
  price: string
}
export interface PackageDraft {
  id: string
  hours: string
  price: string
}
export interface RuleDraft {
  id: string
  dateType: RuleDateType
  change: RuleChange
  value: string
  from?: string
  to?: string
  weekdays: number[]
  active: boolean
}
export interface PricingDraft {
  hourly: TierDraft[]
  packages: PackageDraft[]
  daily: TierDraft[]
  nightly: string
  weekly: TierDraft[]
  monthly: TierDraft[]
  rules: RuleDraft[]
}

/** Errors by field path, e.g. `daily.0.price`, `rules.1.value`, plus `rates` for "no rate at all". */
export type PricingErrors = Record<string, string>

let nextId = 0
/** Ids for rows added in the form (stable within a session; the mock replaces nothing). */
export const newRowId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${nextId++}`

export const emptyTier = (from = ""): TierDraft => ({ id: newRowId("t"), from, to: "", price: "" })
export const emptyPackage = (): PackageDraft => ({ id: newRowId("p"), hours: "", price: "" })
export const emptyRule = (): RuleDraft => ({
  id: newRowId("r"),
  dateType: "range",
  change: "percent",
  value: "",
  weekdays: [],
  active: true,
})

const str = (n: number | null | undefined) => (n == null ? "" : String(n))

export function toPricingDraft(p: Pricing): PricingDraft {
  const tiers = (list: RateTier[]) =>
    list.map((t) => ({ id: t.id, from: str(t.from), to: str(t.to), price: str(t.price) }))
  return {
    hourly: tiers(p.hourly),
    packages: p.packages.map((x) => ({ id: x.id, hours: str(x.hours), price: str(x.price) })),
    daily: tiers(p.daily),
    nightly: str(p.nightly),
    weekly: tiers(p.weekly),
    monthly: tiers(p.monthly),
    rules: p.rules.map((r) => ({
      id: r.id,
      dateType: r.dateType,
      change: r.change,
      value: str(r.value),
      from: r.from,
      to: r.to,
      weekdays: r.weekdays ?? [],
      active: r.active,
    })),
  }
}

/** A new item starts with one daily range, from day 1. */
export const newPricingDraft = (): PricingDraft => ({
  ...toPricingDraft(emptyPricing()),
  daily: [emptyTier("1")],
})

const num = (v: string) => Number(v.trim().replace(",", "."))
const isWhole = (v: string) => /^\d+$/.test(v.trim())
const isAmount = (v: string) => /^\d+([.,]\d{1,2})?$/.test(v.trim())
const isSigned = (v: string) => /^[+-]?\d+([.,]\d{1,2})?$/.test(v.trim())

function priceError(value: string) {
  if (!value.trim()) return "Enter a price."
  if (!isAmount(value)) return "Enter an amount, e.g. 25 or 24.50."
  if (num(value) <= 0) return "The price must be more than 0."
  return undefined
}

function validateTiers(kind: TierKind, tiers: TierDraft[], errors: PricingErrors) {
  const unit = TIER_UNIT[kind]
  tiers.forEach((t, i) => {
    const at = `${kind}.${i}`
    if (!isWhole(t.from) || num(t.from) < 1)
      errors[`${at}.from`] = "Enter a whole number, 1 or more."
    if (t.to.trim()) {
      if (!isWhole(t.to))
        errors[`${at}.to`] = "Enter a whole number, or leave empty for “and more”."
      else if (isWhole(t.from) && num(t.to) < num(t.from))
        errors[`${at}.to`] = `Can't be less than “${unit.label} from”.`
    }
    const price = priceError(t.price)
    if (price) errors[`${at}.price`] = price
  })
  // Ranges must not overlap: each starts after the previous one ends.
  const valid = tiers
    .map((t, i) => ({ i, from: num(t.from), to: t.to.trim() ? num(t.to) : Infinity }))
    .filter((t) => !errors[`${kind}.${t.i}.from`] && !errors[`${kind}.${t.i}.to`])
    .sort((a, b) => a.from - b.from)
  for (let k = 1; k < valid.length; k++) {
    const prev = valid[k - 1]!
    const cur = valid[k]!
    if (cur.from <= prev.to)
      errors[`${kind}.${cur.i}.from`] =
        `Overlaps another range. Start after ${Number.isFinite(prev.to) ? prev.to : prev.from + "+"} ${unit.plural}.`
  }
}

export function validatePricing(d: PricingDraft): PricingErrors {
  const errors: PricingErrors = {}
  validateTiers("hourly", d.hourly, errors)
  validateTiers("daily", d.daily, errors)
  validateTiers("weekly", d.weekly, errors)
  validateTiers("monthly", d.monthly, errors)
  d.packages.forEach((p, i) => {
    if (!isWhole(p.hours) || num(p.hours) < 1 || num(p.hours) > 24)
      errors[`packages.${i}.hours`] = "Enter whole hours, 1 to 24."
    const price = priceError(p.price)
    if (price) errors[`packages.${i}.price`] = price
  })
  if (d.nightly.trim()) {
    const price = priceError(d.nightly)
    if (price) errors.nightly = price
  }
  const anyRate =
    d.hourly.length + d.packages.length + d.daily.length + d.weekly.length + d.monthly.length > 0 ||
    d.nightly.trim() !== ""
  if (!anyRate) errors.rates = "Add at least one rate — for example a daily price."
  d.rules.forEach((r, i) => {
    const at = `rules.${i}`
    if (!isSigned(r.value) || num(r.value) === 0)
      errors[`${at}.value`] = "Enter a change, e.g. 20 or -15."
    else if (r.change === "percent" && num(r.value) < -100)
      errors[`${at}.value`] = "A discount can't be more than 100%."
    if (r.dateType === "range" && (!r.from || !r.to))
      errors[`${at}.dates`] = "Choose the first and last day."
    if (r.dateType === "weekdays" && r.weekdays.length === 0)
      errors[`${at}.weekdays`] = "Choose at least one day."
  })
  return errors
}

/** A valid draft as pricing. Call only when `validatePricing` returns no errors. */
export function toPricing(d: PricingDraft): Pricing {
  const tiers = (list: TierDraft[]) =>
    list
      .map((t) => ({
        id: t.id,
        from: num(t.from),
        to: t.to.trim() ? num(t.to) : null,
        price: num(t.price),
      }))
      .sort((a, b) => a.from - b.from)
  return {
    hourly: tiers(d.hourly),
    packages: d.packages
      .map((p) => ({ id: p.id, hours: num(p.hours), price: num(p.price) }))
      .sort((a, b) => a.hours - b.hours),
    daily: tiers(d.daily),
    nightly: d.nightly.trim() ? num(d.nightly) : null,
    weekly: tiers(d.weekly),
    monthly: tiers(d.monthly),
    rules: d.rules.map((r) => ({
      id: r.id,
      dateType: r.dateType,
      change: r.change,
      value: num(r.value),
      ...(r.dateType === "range" ? { from: r.from, to: r.to } : { weekdays: [...r.weekdays] }),
      active: r.active,
    })),
  }
}
