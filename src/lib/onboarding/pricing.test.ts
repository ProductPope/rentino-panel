import { describe, expect, it } from "vitest"

import {
  applyRules,
  emptyPricing,
  newPricingDraft,
  pricingSummary,
  rateCount,
  ruleApplies,
  ruleSummary,
  startingPrice,
  tierRange,
  toPricing,
  toPricingDraft,
  validatePricing,
  type PriceRule,
  type Pricing,
  type PricingDraft,
} from "./pricing"

const rule = (patch: Partial<PriceRule>): PriceRule => ({
  id: "r",
  dateType: "range",
  change: "percent",
  value: 20,
  from: "2027-06-01",
  to: "2027-08-31",
  active: true,
  ...patch,
})

const pricing: Pricing = {
  ...emptyPricing(),
  hourly: [
    { id: "h1", from: 1, to: 2, price: 8 },
    { id: "h2", from: 3, to: 4, price: 7 },
  ],
  daily: [
    { id: "d1", from: 1, to: 2, price: 35 },
    { id: "d2", from: 3, to: 6, price: 30 },
    { id: "d3", from: 7, to: null, price: 26 },
  ],
  weekly: [{ id: "w1", from: 1, to: null, price: 180 }],
  rules: [rule({}), rule({ id: "off", active: false })],
}

const draft = (patch: Partial<PricingDraft>): PricingDraft => ({
  ...newPricingDraft(),
  daily: [],
  ...patch,
})

describe("dynamic pricing rules", () => {
  it("add up before the final price: +20% and −30% make −10%", () => {
    const rules = [rule({ value: 20 }), rule({ id: "b", value: -30 })]
    expect(applyRules(100, rules, new Date(2027, 6, 15))).toBe(90)
  })

  it("percentages and fixed amounts both apply; never below 0", () => {
    const rules = [rule({ value: 10 }), rule({ id: "f", change: "fixed", value: -5 })]
    expect(applyRules(50, rules, new Date(2027, 6, 1))).toBe(50)
    expect(applyRules(10, [rule({ change: "fixed", value: -50 })], new Date(2027, 6, 1))).toBe(0)
  })

  it("apply only on their dates, and only when active", () => {
    expect(ruleApplies(rule({}), new Date(2027, 5, 1))).toBe(true)
    expect(ruleApplies(rule({}), new Date(2027, 8, 1))).toBe(false)
    expect(ruleApplies(rule({ active: false }), new Date(2027, 6, 1))).toBe(false)
    const weekend = rule({ dateType: "weekdays", weekdays: [6, 0], from: undefined, to: undefined })
    expect(ruleApplies(weekend, new Date(2026, 9, 10))).toBe(true) // Saturday
    expect(ruleApplies(weekend, new Date(2026, 9, 12))).toBe(false) // Monday
  })

  it("read in plain words", () => {
    expect(ruleSummary(rule({}))).toBe("+20% · Jun 1, 2027 – Aug 31, 2027")
    expect(
      ruleSummary(rule({ dateType: "weekdays", weekdays: [0, 6], change: "fixed", value: -5 }))
    ).toBe("−$5.00 · Sat, Sun")
  })
})

describe("summaries", () => {
  it("lowest price per kind, the first three kinds, and active rules", () => {
    expect(pricingSummary(pricing)).toBe(
      "from $7.00 / hour · from $26.00 / day · $180.00 / week · 1 price rule"
    )
    expect(pricingSummary(emptyPricing())).toBe("No prices yet")
    expect(rateCount(pricing, "daily")).toBe(3)
    expect(rateCount({ ...pricing, nightly: 40 }, "nightly")).toBe(1)
  })

  it("the booking page starts from the daily price, else the first kind there is", () => {
    expect(startingPrice(pricing)).toEqual({ amount: 26, suffix: "/ day" })
    expect(startingPrice({ ...emptyPricing(), nightly: 40 })).toEqual({
      amount: 40,
      suffix: "/ night",
    })
    expect(startingPrice(emptyPricing())).toBeUndefined()
  })

  it("ranges read naturally", () => {
    expect(tierRange("daily", { from: 1, to: 2 })).toBe("1–2 days")
    expect(tierRange("daily", { from: 7, to: null })).toBe("7+ days")
    expect(tierRange("hourly", { from: 1, to: 1 })).toBe("1 hour")
  })
})

describe("validatePricing", () => {
  it("needs at least one rate", () => {
    expect(validatePricing(draft({}))).toEqual({
      rates: "Add at least one rate — for example a daily price.",
    })
    expect(validatePricing(draft({ nightly: "40" }))).toEqual({})
  })

  it("checks every range: numbers, order, price", () => {
    expect(
      validatePricing(
        draft({
          daily: [
            { id: "a", from: "0", to: "x", price: "" },
            { id: "b", from: "5", to: "3", price: "0" },
          ],
        })
      )
    ).toEqual({
      "daily.0.from": "Enter a whole number, 1 or more.",
      "daily.0.to": "Enter a whole number, or leave empty for “and more”.",
      "daily.0.price": "Enter a price.",
      "daily.1.to": "Can't be less than “Day from”.",
      "daily.1.price": "The price must be more than 0.",
    })
  })

  it("ranges of a kind can't overlap", () => {
    const errors = validatePricing(
      draft({
        hourly: [
          { id: "a", from: "1", to: "3", price: "8" },
          { id: "b", from: "3", to: "5", price: "7" },
        ],
      })
    )
    expect(errors).toEqual({ "hourly.1.from": "Overlaps another range. Start after 3 hours." })
  })

  it("packages and rules", () => {
    const errors = validatePricing(
      draft({
        nightly: "40",
        packages: [{ id: "p", hours: "30", price: "90" }],
        rules: [
          {
            id: "r1",
            dateType: "range",
            change: "percent",
            value: "-150",
            weekdays: [],
            active: true,
          },
          {
            id: "r2",
            dateType: "weekdays",
            change: "fixed",
            value: "0",
            weekdays: [],
            active: true,
          },
        ],
      })
    )
    expect(errors).toEqual({
      "packages.0.hours": "Enter whole hours, 1 to 24.",
      "rules.0.value": "A discount can't be more than 100%.",
      "rules.0.dates": "Choose the first and last day.",
      "rules.1.value": "Enter a change, e.g. 20 or -15.",
      "rules.1.weekdays": "Choose at least one day.",
    })
  })

  it("round-trips through the form, sorted by range", () => {
    const back = toPricing(toPricingDraft(pricing))
    expect(back).toEqual(pricing)
    const sorted = toPricing(
      draft({
        daily: [
          { id: "b", from: "3", to: "", price: "30" },
          { id: "a", from: "1", to: "2", price: "35,50" },
        ],
      })
    )
    expect(sorted.daily).toEqual([
      { id: "a", from: 1, to: 2, price: 35.5 },
      { id: "b", from: 3, to: null, price: 30 },
    ])
  })
})
