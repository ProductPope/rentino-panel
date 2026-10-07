import { describe, expect, it } from "vitest"

import { emptyPricing, newPricingDraft } from "./pricing"
import {
  assignCodes,
  codeRange,
  equipmentTotals,
  normalizePrefix,
  fromPrice,
  prefixFor,
  toEquipmentDraft,
  toEquipmentInput,
  validateEquipment,
  type EquipmentDraft,
  type EquipmentItem,
} from "./equipment"

const valid: EquipmentDraft = {
  name: "Trek Marlin 7",
  category: "Bikes",
  units: "14",
  codePrefix: "BIK",
  pricing: { ...newPricingDraft(), daily: [{ id: "d", from: "1", to: "", price: "35" }] },
}

const item = (patch: Partial<EquipmentItem>): EquipmentItem => ({
  id: "x",
  name: "Item",
  category: "Bikes",
  units: 1,
  codePrefix: "BIK",
  pricing: { ...emptyPricing(), daily: [{ id: "d", from: 1, to: null, price: 10 }] },
  ...patch,
})

describe("validateEquipment", () => {
  it("accepts a complete item; the weekly price is optional", () => {
    expect(validateEquipment(valid)).toEqual({})
  })

  it("explains every missing or wrong field", () => {
    expect(
      validateEquipment({
        name: " ",
        category: "",
        units: "0",
        codePrefix: "B",
        pricing: newPricingDraft(),
      })
    ).toEqual({
      name: "Enter a name.",
      category: "Choose a category.",
      units: "Enter a whole number from 1 to 999.",
      codePrefix: "Use 2–6 letters or digits, e.g. BIK.",
      "daily.0.price": "Enter a price.",
    })
  })

  it("rejects fractions of units and too many units", () => {
    expect(validateEquipment({ ...valid, units: "1.5" }).units).toBeDefined()
    expect(validateEquipment({ ...valid, units: "1000" }).units).toBeDefined()
  })
})

describe("prices and prefixes", () => {
  it("suggests a prefix per category and keeps prefixes to capitals and digits", () => {
    expect(prefixFor("Golf carts")).toBe("GLF")
    expect(prefixFor("Unknown")).toBe("")
    expect(normalizePrefix("bik-2x long")).toBe("BIK2XL")
  })

  it("round-trips an item through the form", () => {
    const input = toEquipmentInput(valid)
    expect(input).toEqual({
      name: "Trek Marlin 7",
      category: "Bikes",
      units: 14,
      codePrefix: "BIK",
      pricing: { ...emptyPricing(), daily: [{ id: "d", from: 1, to: null, price: 35 }] },
    })
    expect(toEquipmentDraft({ id: "1", ...input })).toMatchObject({
      units: "14",
      pricing: { daily: [{ id: "d", from: "1", to: "", price: "35" }] },
    })
  })
})

describe("unit codes", () => {
  it("numbers units on across items with the same prefix", () => {
    const codes = assignCodes([
      item({ id: "a", units: 2 }),
      item({ id: "b", units: 1, codePrefix: "GLF" }),
      item({ id: "c", units: 3 }),
    ])
    expect(codes.get("a")).toEqual({ first: "BIK-001", last: "BIK-002" })
    expect(codes.get("b")).toEqual({ first: "GLF-001", last: "GLF-001" })
    expect(codes.get("c")).toEqual({ first: "BIK-003", last: "BIK-005" })
  })

  it("shows one code for one unit and a range for more", () => {
    expect(codeRange({ first: "GLF-001", last: "GLF-001" })).toBe("GLF-001")
    expect(codeRange({ first: "BIK-001", last: "BIK-014" })).toBe("BIK-001…BIK-014")
  })
})

describe("summaries", () => {
  it("the booking page shows where prices start", () => {
    expect(fromPrice(item({}))).toBe("from $10.00 / day")
    expect(fromPrice(item({ pricing: emptyPricing() }))).toBe("Price on request")
  })

  it("counts only the customer's own items", () => {
    expect(
      equipmentTotals([
        item({ id: "d", demo: true, units: 5 }),
        item({ id: "a", units: 14 }),
        item({ id: "b", units: 2, category: "Kayaks" }),
      ])
    ).toEqual({ items: 2, units: 16, categories: 2, demo: 1 })
  })
})
