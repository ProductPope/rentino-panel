import { describe, expect, it } from "vitest"

import type { EquipmentItem } from "./equipment"
import { emptyPricing } from "./pricing"
import { bookingDomain, bookingPreviewItems, initials, setupRows } from "./start"
import type { OnboardingStatus } from "./types"

const item = (patch: Partial<EquipmentItem>): EquipmentItem => ({
  id: "x",
  name: "City bike",
  parentCategory: "Bikes",
  units: 14,
  codePrefix: "BIK",
  pricing: { ...emptyPricing(), daily: [{ id: "d", from: 1, to: null, price: 18 }] },
  ...patch,
})

const status = {
  stage: "imported",
  account: { name: "Bikes Mallorca", city: "Palma", email: "a@b.c" },
  processing: { activeStep: 0, long: false },
  draft: { categories: 3, units: 26, addons: 2, openDecisions: 0 },
  settings: {
    payMode: "full",
    depositPercent: 20,
    restDaysBefore: 2,
    delivery: false,
    freeFromDays: 3,
    deliveryFee: 10,
    perKmFee: null,
    vatRate: 21,
    vatCountry: "Spain",
    vatConfirmed: true,
    cardFeePercent: null,
    signatureRequired: true,
  },
  settingsDone: true,
  paymentsConnected: false,
} satisfies OnboardingStatus

describe("booking page", () => {
  it("derives the address and initials from the business name", () => {
    expect(bookingDomain("Bikes Mallorca")).toBe("bikesmallorca.rentino.app")
    expect(bookingDomain("Café Kayak & Co.")).toBe("cafekayakco.rentino.app")
    expect(bookingDomain("—")).toBe("your-business.rentino.app")
    expect(initials("Bikes Mallorca")).toBe("BM")
  })

  it("previews only the customer's own items that are shown online", () => {
    const hidden = item({
      id: "h",
      online: {
        visible: false,
        slug: "h",
        descriptions: {},
        descriptionFields: [],
        checkoutFields: [],
      },
    })
    expect(
      bookingPreviewItems([
        item({ id: "d", demo: true }),
        hidden,
        item({ id: "a", photoUrl: "/a.webp" }),
      ])
    ).toEqual([{ id: "a", name: "City bike", photoUrl: "/a.webp", price: "from $18.00 / day" }])
  })
})

describe("setupRows", () => {
  it("summarises equipment and every settings area, each with the step to edit it", () => {
    expect(setupRows(status, [item({ id: "a" }), item({ id: "b", units: 2 })])).toEqual([
      { label: "2 items · 16 units", area: "equipment" },
      { label: "Full payment online", area: "settings" },
      { label: "Pickup only", area: "settings" },
      { label: "VAT 21%, confirmed · no card fee", area: "settings" },
      { label: "Customer signature on", area: "settings" },
    ])
  })

  it("falls back to the imported draft's counts when there's no list (price list path)", () => {
    expect(setupRows(status, [])[0]?.label).toBe("3 categories · 26 units")
  })
})
