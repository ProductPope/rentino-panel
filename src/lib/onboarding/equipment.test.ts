import { describe, expect, it } from "vitest"

import { emptyPricing, newPricingDraft } from "./pricing"
import {
  assignCodes,
  draftUnits,
  firstNumber,
  unitsByItem,
  unitsOf,
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
  parentCategory: "Bikes",
  units: "14",
  codePrefix: "BIK",
  unitOverrides: [],
  pricing: { ...newPricingDraft(), daily: [{ id: "d", from: "1", to: "", price: "35" }] },
}

const item = (patch: Partial<EquipmentItem>): EquipmentItem => ({
  id: "x",
  name: "Item",
  parentCategory: "Bikes",
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
        parentCategory: "",
        units: "0",
        codePrefix: "B",
        pricing: newPricingDraft(),
        unitOverrides: [],
      })
    ).toEqual({
      name: "Enter a name.",
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
      parentCategory: "Bikes",
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
        item({ id: "b", units: 2, parentCategory: "Kayaks" }),
      ])
    ).toEqual({ items: 2, units: 16, categories: 2, demo: 1 })
  })
})

describe("parent category", () => {
  it("is optional; without one an item counts as its own category", () => {
    expect(validateEquipment({ ...valid, parentCategory: "" })).toEqual({})
    const input = toEquipmentInput({ ...valid, parentCategory: "" })
    expect(input).not.toHaveProperty("parentCategory")
    expect(
      equipmentTotals([
        item({ id: "a", parentCategory: undefined }),
        item({ id: "b", parentCategory: undefined }),
      ]).categories
    ).toBe(2)
  })
})

describe("units", () => {
  const trek = item({
    id: "t",
    name: "Trek",
    units: 3,
    photoUrl: "/trek.webp",
    unitOverrides: [
      { position: 2, code: "FRAME-123", name: "Trek, size L" },
      { position: 3, photoUrl: "/trek-3.webp" },
    ],
  })

  it("own code, name or photo per unit; the rest comes from the item", () => {
    expect(unitsOf(trek, 4)).toEqual([
      {
        position: 1,
        code: "BIK-004",
        defaultCode: "BIK-004",
        name: "Trek",
        photoUrl: "/trek.webp",
        ownCode: false,
        ownName: false,
        ownPhoto: false,
      },
      {
        position: 2,
        code: "FRAME-123",
        defaultCode: "BIK-005",
        name: "Trek, size L",
        photoUrl: "/trek.webp",
        ownCode: true,
        ownName: true,
        ownPhoto: false,
      },
      {
        position: 3,
        code: "BIK-006",
        defaultCode: "BIK-006",
        name: "Trek",
        photoUrl: "/trek-3.webp",
        ownCode: false,
        ownName: false,
        ownPhoto: true,
      },
    ])
  })

  it("default numbers continue after earlier items with the same prefix", () => {
    expect(firstNumber([item({ units: 2 }), item({ units: 5, codePrefix: "GLF" })], "BIK")).toBe(3)
    const units = unitsByItem([item({ id: "a", units: 2 }), trek])
    expect(units.get("t")?.map((u) => u.defaultCode)).toEqual(["BIK-003", "BIK-004", "BIK-005"])
  })

  it("unit codes must be well formed and unique, within the item and across items", () => {
    const draft = {
      ...valid,
      units: "4",
      unitOverrides: [
        { position: 1, code: "X", name: "" },
        // Unit 3 keeps its default code, BIK-003: unit 2 can't take it.
        { position: 2, code: "BIK-003", name: "" },
        { position: 4, code: "TAKEN-1", name: "" },
      ],
    }
    expect(validateEquipment(draft, { takenCodes: new Set(["TAKEN-1"]) })).toEqual({
      "unit.1.code": "Use 2–20 letters, digits or “-”.",
      "unit.3.code": "BIK-003 is already used. Codes must be unique.",
      "unit.4.code": "TAKEN-1 is already used. Codes must be unique.",
    })
  })

  it("saves only overrides that change something, for units that exist", () => {
    const input = toEquipmentInput({
      ...valid,
      units: "2",
      unitOverrides: [
        { position: 1, code: "", name: " " },
        { position: 2, code: "SN-9", name: "", photoUrl: "data:x" },
        { position: 5, code: "GONE", name: "" },
      ],
    })
    expect(input.unitOverrides).toEqual([{ position: 2, code: "SN-9", photoUrl: "data:x" }])
  })

  it("the panel previews units as typed", () => {
    expect(draftUnits({ ...valid, units: "2", name: "" }, 1).map((u) => [u.code, u.name])).toEqual([
      ["BIK-001", "This equipment"],
      ["BIK-002", "This equipment"],
    ])
    expect(draftUnits({ ...valid, units: "x" }, 1)).toEqual([])
  })
})
