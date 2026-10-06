import { describe, expect, it } from "vitest"

import { canDelete, formatValidity, formatValue, matchesQuery, statusOf } from "./rules"

describe("statusOf (WHLZ-566)", () => {
  const today = "2026-10-06"

  it("is inactive when switched off, whatever the dates", () => {
    expect(statusOf({ active: false, validFrom: "2026-01-01" }, today)).toBe("inactive")
  })
  it("is scheduled before “valid from”", () => {
    expect(statusOf({ active: true, validFrom: "2026-10-07" }, today)).toBe("scheduled")
  })
  it("is expired after “valid to”", () => {
    expect(statusOf({ active: true, validTo: "2026-10-05" }, today)).toBe("expired")
  })
  it("includes both boundary days", () => {
    expect(statusOf({ active: true, validFrom: today, validTo: today }, today)).toBe("active")
  })
  it("never expires without dates", () => {
    expect(statusOf({ active: true }, today)).toBe("active")
  })
})

describe("canDelete", () => {
  it("allows only unused codes", () => {
    expect(canDelete({ uses: 0 })).toBe(true)
    expect(canDelete({ uses: 1 })).toBe(false)
  })
})

describe("formatting", () => {
  it("formats percentages and tenant-currency amounts", () => {
    expect(formatValue({ type: "percentage", value: 12.5 })).toBe("12.5%")
    expect(formatValue({ type: "fixed", value: 50 })).toBe("$50.00")
  })
  it("describes validity", () => {
    expect(formatValidity({})).toBe("No end date")
    expect(formatValidity({ validFrom: "2027-03-15" })).toBe("From Mar 15, 2027")
    expect(formatValidity({ validTo: "2026-11-05" })).toBe("Until Nov 5, 2026")
    expect(formatValidity({ validFrom: "2026-11-27", validTo: "2026-11-30" })).toBe(
      "Nov 27, 2026 – Nov 30, 2026"
    )
  })
})

describe("matchesQuery", () => {
  it("matches code and note, case-insensitive", () => {
    const code = { code: "WINTERSALE", description: "Winter campaign" }
    expect(matchesQuery(code, "wintersale")).toBe(true)
    expect(matchesQuery(code, "CAMPAIGN")).toBe(true)
    expect(matchesQuery(code, "summer")).toBe(false)
    expect(matchesQuery(code, "  ")).toBe(true)
  })
})
