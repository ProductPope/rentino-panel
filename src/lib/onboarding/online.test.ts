import { describe, expect, it } from "vitest"

import {
  isOnline,
  normalizeSlug,
  prefixFromName,
  productUrlBase,
  slugify,
  slugOf,
  toOnline,
  toOnlineDraft,
  validateOnline,
} from "./online"

describe("addresses and codes from the name", () => {
  it("slugs drop accents and punctuation", () => {
    expect(slugify('Trek Marlin 7 – 29"')).toBe("trek-marlin-7-29")
    expect(slugify("Rower łódź")).toBe("rower-lodz")
    expect(slugify("  ")).toBe("")
    expect(normalizeSlug("City Bike!")).toBe("city-bike")
  })

  it("the default code is the first five letters or digits of the name", () => {
    expect(prefixFromName("Trek Marlin 7")).toBe("TREKM")
    expect(prefixFromName("E-bike")).toBe("EBIKE")
    expect(prefixFromName("Kajak")).toBe("KAJAK")
    expect(prefixFromName("SUP")).toBe("SUP")
  })

  it("builds the product address base", () => {
    expect(productUrlBase("bikesmallorca.rentino.app")).toBe(
      "https://bikesmallorca.rentino.app/product/"
    )
  })
})

describe("validateOnline", () => {
  const draft = toOnlineDraft(undefined, "City bike")

  it("a new item is shown, with an address from its name", () => {
    expect(draft).toMatchObject({ visible: true, slug: "city-bike" })
    expect(validateOnline(draft)).toEqual({})
  })

  it("explains a missing, malformed or taken address", () => {
    expect(validateOnline({ ...draft, slug: "" })["online.slug"]).toMatch(/Enter/)
    expect(validateOnline({ ...draft, slug: "city--bike" })["online.slug"]).toMatch(/single/)
    expect(validateOnline(draft, new Set(["city-bike"]))["online.slug"]).toBe(
      "Another item uses “city-bike”. Addresses must be unique."
    )
  })

  it("limits each description", () => {
    const long = { ...draft, descriptions: { de: "x".repeat(2001) } }
    expect(validateOnline(long)).toEqual({
      "online.description.de": "Shorten the German description to 2000 characters.",
    })
  })
})

describe("saving", () => {
  it("keeps only descriptions with text", () => {
    const online = toOnline({
      ...toOnlineDraft(undefined, "Kayak"),
      descriptions: { en: " Two seats ", pl: "  " },
    })
    expect(online.descriptions).toEqual({ en: "Two seats" })
  })

  it("items saved before these settings are shown, under an address from their name", () => {
    expect(isOnline({})).toBe(true)
    expect(isOnline({ online: { visible: false } })).toBe(false)
    expect(slugOf({ name: "Club Car Tempo" })).toBe("club-car-tempo")
  })
})
