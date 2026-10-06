import { describe, expect, it } from "vitest"

import { normalizeCode, parseAmount, toDraft, toInput, validateDiscountCode } from "./validation"

const draft = (over: Partial<ReturnType<typeof toDraft>> = {}) => ({
  ...toDraft(),
  code: "WINTERSALE",
  value: "10",
  ...over,
})
const existing = [{ id: "dc-1", code: "WINTERSALE" }]

describe("validateDiscountCode (WHLZ-566)", () => {
  it("accepts a valid percentage code", () => {
    expect(validateDiscountCode(draft())).toEqual({})
  })

  it("requires a code of A–Z, 0–9, - and _", () => {
    expect(validateDiscountCode(draft({ code: "" })).code).toBe("Enter a code.")
    expect(validateDiscountCode(draft({ code: "ZIMA!" })).code).toMatch(/Use only letters/)
    expect(validateDiscountCode(draft({ code: "SPRING-2027_A" })).code).toBeUndefined()
    expect(validateDiscountCode(draft({ code: "ŻUBR" })).code).toMatch(/Use only letters/)
  })

  it("checks uniqueness case-insensitively, ignoring the code being edited", () => {
    expect(validateDiscountCode(draft({ code: "wintersale" }), existing).code).toMatch(
      /already exists/
    )
    expect(validateDiscountCode(draft(), existing, "dc-1").code).toBeUndefined()
  })

  it("keeps percentages within 0.01–100", () => {
    expect(validateDiscountCode(draft({ value: "0" })).value).toMatch(/between 0.01 and 100/)
    expect(validateDiscountCode(draft({ value: "100.5" })).value).toMatch(/between 0.01 and 100/)
    expect(validateDiscountCode(draft({ value: "0.01" })).value).toBeUndefined()
    expect(validateDiscountCode(draft({ value: "100" })).value).toBeUndefined()
  })

  it("requires a fixed amount above 0", () => {
    expect(validateDiscountCode(draft({ type: "fixed", value: "0" })).value).toMatch(
      /greater than 0/
    )
    expect(validateDiscountCode(draft({ type: "fixed", value: "250" })).value).toBeUndefined()
  })

  it("rejects text, empty values and more than 2 decimals", () => {
    expect(validateDiscountCode(draft({ value: "" })).value).toBe("Enter a value.")
    expect(validateDiscountCode(draft({ value: "ten" })).value).toMatch(/Enter a number/)
    expect(validateDiscountCode(draft({ value: "10.555" })).value).toMatch(/2 decimal/)
  })

  it("keeps the end date on or after the start date", () => {
    expect(
      validateDiscountCode(draft({ validFrom: "2026-11-02", validTo: "2026-11-01" })).validity
    ).toBeDefined()
    expect(
      validateDiscountCode(draft({ validFrom: "2026-11-01", validTo: "2026-11-01" })).validity
    ).toBeUndefined()
  })
})

describe("normalising", () => {
  it("stores codes upper-case without spaces", () => {
    expect(normalizeCode(" winter sale ")).toBe("WINTERSALE")
  })
  it("parses decimal comma and point", () => {
    expect(parseAmount("12,5")).toBe(12.5)
    expect(parseAmount("12.5")).toBe(12.5)
    expect(parseAmount("1e3")).toBeNaN()
  })
  it("turns a draft into input, dropping empty optional fields", () => {
    expect(toInput(draft({ code: "spring", value: "12,5", description: "  " }))).toEqual({
      code: "SPRING",
      type: "percentage",
      value: 12.5,
      validFrom: undefined,
      validTo: undefined,
      active: true,
      description: undefined,
    })
  })
})
