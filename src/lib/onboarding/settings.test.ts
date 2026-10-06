import { describe, expect, it } from "vitest"

import {
  settingsSummary,
  toSettings,
  toSettingsDraft,
  validateSettings,
  vatLabel,
  type SettingsDraft,
} from "./settings"
import type { RentalSettings } from "./types"

const current: RentalSettings = {
  payMode: "deposit",
  depositPercent: 20,
  restDaysBefore: 2,
  delivery: true,
  freeFromDays: 3,
  deliveryFee: 10,
  perKmFee: null,
  vatRate: 21,
  vatCountry: "Spain",
  vatConfirmed: false,
  cardFeePercent: null,
  signatureRequired: true,
}
const draft = (patch: Partial<SettingsDraft> = {}): SettingsDraft => ({
  ...toSettingsDraft(current),
  vatConfirmed: true,
  ...patch,
})

describe("validateSettings", () => {
  it("accepts the suggested settings once VAT is confirmed", () => {
    expect(validateSettings(draft())).toEqual({})
    expect(validateSettings(draft({ vatConfirmed: false }))).toEqual({
      vatConfirmed: "Confirm the VAT rate to continue.",
    })
  })

  it("checks deposit and delivery fields only when they are shown", () => {
    const bad = { depositPercent: "120", restDaysBefore: "x", freeFromDays: "0", deliveryFee: "" }
    expect(validateSettings(draft(bad))).toEqual({
      depositPercent: "Enter a whole number from 1 to 99.",
      restDaysBefore: "Enter a whole number from 0 to 60.",
      freeFromDays: "Enter a whole number from 1 to 365.",
      deliveryFee: "Enter an amount.",
    })
    expect(validateSettings(draft({ ...bad, payMode: "full", delivery: false }))).toEqual({})
  })

  it("the per-km fee is optional; a card fee needs a sensible percentage", () => {
    expect(validateSettings(draft({ perKmFee: "" }))).toEqual({})
    expect(validateSettings(draft({ perKmFee: "0" })).perKmFee).toBe(
      "The amount must be more than 0."
    )
    expect(validateSettings(draft({ cardFee: true, cardFeePercent: "15" })).cardFeePercent).toBe(
      "Enter a percentage from 0.01 to 10."
    )
    expect(validateSettings(draft({ cardFee: true, cardFeePercent: "1,5" }))).toEqual({})
  })
})

describe("toSettings", () => {
  it("reads the form and keeps hidden values as they were", () => {
    const next = toSettings(
      draft({ payMode: "full", depositPercent: "", delivery: true, perKmFee: "0.80" }),
      current
    )
    expect(next).toMatchObject({
      payMode: "full",
      depositPercent: 20,
      perKmFee: 0.8,
      vatConfirmed: true,
      cardFeePercent: null,
    })
    expect(
      toSettings(draft({ cardFee: true, cardFeePercent: "1,5" }), current).cardFeePercent
    ).toBe(1.5)
  })
})

describe("summary", () => {
  it("one line per area, in plain words", () => {
    const s = toSettings(draft(), current)
    expect(vatLabel(s)).toBe("21% · Spain")
    expect(settingsSummary(s)).toEqual({
      payments: "20% deposit, the rest 2 days before pickup",
      delivery: "Free delivery from 3 days, otherwise $10.00",
      taxes: "VAT 21%, confirmed · no card fee",
      signature: "Customer signature on",
    })
    expect(settingsSummary({ ...s, payMode: "full", delivery: false }).delivery).toBe("Pickup only")
  })
})
