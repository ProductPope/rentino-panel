import { describe, expect, it } from "vitest"

import {
  assignCodes,
  codeRange,
  equipmentTotals,
  normalizePrefix,
  parsePrice,
  prefixFor,
  priceSummary,
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
  pricePerDay: "35",
  pricePerWeek: "",
}

const item = (patch: Partial<EquipmentItem>): EquipmentItem => ({
  id: "x",
  name: "Item",
  category: "Bikes",
  units: 1,
  codePrefix: "BIK",
  pricePerDay: 10,
  pricePerWeek: null,
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
        pricePerDay: "",
        pricePerWeek: "abc",
      })
    ).toEqual({
      name: "Enter a name.",
      category: "Choose a category.",
      units: "Enter a whole number from 1 to 999.",
      codePrefix: "Use 2–6 letters or digits, e.g. BIK.",
      pricePerDay: "Enter a price per day.",
      pricePerWeek: "Enter an amount, e.g. 25 or 24.50.",
    })
  })

  it("rejects fractions of units, too many units and a zero price", () => {
    expect(validateEquipment({ ...valid, units: "1.5" }).units).toBeDefined()
    expect(validateEquipment({ ...valid, units: "1000" }).units).toBeDefined()
    expect(validateEquipment({ ...valid, pricePerDay: "0" }).pricePerDay).toBe(
      "The price must be more than 0."
    )
  })
})

describe("prices and prefixes", () => {
  it("parses prices with a dot or a comma", () => {
    expect(parsePrice("24,50")).toBe(24.5)
    expect(parsePrice(" 12 ")).toBe(12)
    expect(parsePrice("")).toBeNull()
    expect(parsePrice("12.345")).toBeNaN()
  })

  it("suggests a prefix per category and keeps prefixes to capitals and digits", () => {
    expect(prefixFor("Golf carts")).toBe("GLF")
    expect(prefixFor("Unknown")).toBe("")
    expect(normalizePrefix("bik-2x long")).toBe("BIK2XL")
  })

  it("round-trips an item through the form", () => {
    const input = toEquipmentInput({ ...valid, pricePerWeek: "180" })
    expect(input).toEqual({
      name: "Trek Marlin 7",
      category: "Bikes",
      units: 14,
      codePrefix: "BIK",
      pricePerDay: 35,
      pricePerWeek: 180,
    })
    expect(toEquipmentDraft({ id: "1", ...input })).toMatchObject({
      units: "14",
      pricePerWeek: "180",
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
  it("formats the daily and weekly price", () => {
    expect(priceSummary({ pricePerDay: 35, pricePerWeek: 180 })).toBe(
      "$35.00 / day · $180.00 / week"
    )
    expect(priceSummary({ pricePerDay: 12, pricePerWeek: null })).toBe("$12.00 / day")
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
