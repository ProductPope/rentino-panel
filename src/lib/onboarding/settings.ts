import { formatMoney } from "@/lib/tenant"

import type { RentalSettings } from "./types"

/** What the settings form holds: numbers as typed. */
export interface SettingsDraft {
  payMode: RentalSettings["payMode"]
  depositPercent: string
  restDaysBefore: string
  delivery: boolean
  freeFromDays: string
  deliveryFee: string
  perKmFee: string
  vatConfirmed: boolean
  cardFee: boolean
  cardFeePercent: string
  signatureRequired: boolean
}

export type SettingsErrors = Partial<Record<keyof SettingsDraft, string>>

const str = (n: number | null) => (n == null ? "" : String(n))

export function toSettingsDraft(s: RentalSettings): SettingsDraft {
  return {
    payMode: s.payMode,
    depositPercent: str(s.depositPercent),
    restDaysBefore: str(s.restDaysBefore),
    delivery: s.delivery,
    freeFromDays: str(s.freeFromDays),
    deliveryFee: str(s.deliveryFee),
    perKmFee: str(s.perKmFee),
    vatConfirmed: s.vatConfirmed,
    cardFee: s.cardFeePercent != null,
    cardFeePercent: str(s.cardFeePercent),
    signatureRequired: s.signatureRequired,
  }
}

const isWhole = (v: string) => /^\d+$/.test(v.trim())
const isAmount = (v: string) => /^\d+([.,]\d{1,2})?$/.test(v.trim())
const toNumber = (v: string) => Number(v.trim().replace(",", "."))

function wholeError(value: string, min: number, max: number) {
  if (!isWhole(value) || toNumber(value) < min || toNumber(value) > max)
    return `Enter a whole number from ${min} to ${max}.`
  return undefined
}

function amountError(value: string, required: boolean) {
  if (!value.trim()) return required ? "Enter an amount." : undefined
  if (!isAmount(value)) return "Enter an amount, e.g. 10 or 9.50."
  if (toNumber(value) <= 0) return "The amount must be more than 0."
  return undefined
}

/** Fields that are hidden (deposit with full payment, delivery fees with pickup only) aren't checked. */
export function validateSettings(d: SettingsDraft): SettingsErrors {
  const e: SettingsErrors = {}
  if (d.payMode === "deposit") {
    e.depositPercent = wholeError(d.depositPercent, 1, 99)
    e.restDaysBefore = wholeError(d.restDaysBefore, 0, 60)
  }
  if (d.delivery) {
    e.freeFromDays = wholeError(d.freeFromDays, 1, 365)
    e.deliveryFee = amountError(d.deliveryFee, true)
    e.perKmFee = amountError(d.perKmFee, false)
  }
  if (d.cardFee) {
    const fee = d.cardFeePercent.trim()
    if (!isAmount(fee) || toNumber(fee) <= 0 || toNumber(fee) > 10)
      e.cardFeePercent = "Enter a percentage from 0.01 to 10."
  }
  if (!d.vatConfirmed) e.vatConfirmed = "Confirm the VAT rate to continue."
  return Object.fromEntries(Object.entries(e).filter(([, v]) => v)) as SettingsErrors
}

/** A valid draft over the current settings. Hidden fields keep their last saved values. */
export function toSettings(d: SettingsDraft, current: RentalSettings): RentalSettings {
  return {
    ...current,
    payMode: d.payMode,
    depositPercent: d.payMode === "deposit" ? toNumber(d.depositPercent) : current.depositPercent,
    restDaysBefore: d.payMode === "deposit" ? toNumber(d.restDaysBefore) : current.restDaysBefore,
    delivery: d.delivery,
    freeFromDays: d.delivery ? toNumber(d.freeFromDays) : current.freeFromDays,
    deliveryFee: d.delivery ? toNumber(d.deliveryFee) : current.deliveryFee,
    perKmFee: d.delivery ? (d.perKmFee.trim() ? toNumber(d.perKmFee) : null) : current.perKmFee,
    vatConfirmed: d.vatConfirmed,
    cardFeePercent: d.cardFee ? toNumber(d.cardFeePercent) : null,
    signatureRequired: d.signatureRequired,
  }
}

/** "21% · Spain" */
export const vatLabel = (s: Pick<RentalSettings, "vatRate" | "vatCountry">) =>
  `${s.vatRate}% · ${s.vatCountry}`

/** One line per area — what step 5 ("Start") shows the customer was set up for them. */
export function settingsSummary(s: RentalSettings) {
  return {
    payments:
      s.payMode === "deposit"
        ? `${s.depositPercent}% deposit, the rest ${s.restDaysBefore} ${s.restDaysBefore === 1 ? "day" : "days"} before pickup`
        : "Full payment online",
    delivery: s.delivery
      ? `Free delivery from ${s.freeFromDays} ${s.freeFromDays === 1 ? "day" : "days"}, otherwise ${formatMoney(s.deliveryFee)}${s.perKmFee != null ? ` or ${formatMoney(s.perKmFee)} / km` : ""}`
      : "Pickup only",
    taxes: `VAT ${s.vatRate}%${s.vatConfirmed ? ", confirmed" : ", not confirmed"} · ${s.cardFeePercent != null ? `${s.cardFeePercent}% card fee` : "no card fee"}`,
    signature: s.signatureRequired ? "Customer signature on" : "Customer signature off",
  }
}
