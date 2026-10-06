import { describe, expect, it } from "vitest"

import {
  activeProcessingLabel,
  draftReadySummary,
  formatFileSize,
  processingRows,
  sourcesError,
  importedSummary,
  importedTitle,
  nextSteps,
  welcomeSteps,
} from "./rules"
import type { OnboardingStatus } from "./types"

const base: OnboardingStatus = {
  stage: "awaiting_input",
  account: {
    name: "Bikes Mallorca",
    city: "Palma de Mallorca",
    website: "bikesmallorca.com",
    email: "marek@bikesmallorca.com",
    priceListFile: "price-list-2026.pdf",
  },
  processing: { activeStep: 3, long: false },
  draft: { categories: 3, units: 26, addons: 2, openDecisions: 1 },
  settings: { payMode: "deposit", depositPercent: 20, delivery: true },
  settingsDone: false,
  paymentsConnected: false,
}
const at = (patch: Partial<OnboardingStatus>): OnboardingStatus => ({ ...base, ...patch })
const ids = (steps: { id: string }[]) => steps.map((s) => s.id)

describe("welcomeSteps (states A–C)", () => {
  it("A: sending sources is the highlighted next step, then two demo steps", () => {
    const steps = welcomeSteps(base)
    expect(ids(steps)).toEqual(["send_sources", "test_booking", "booking_page"])
    expect(steps[0]).toMatchObject({ highlighted: true })
    expect(steps.slice(1).every((s) => s.demo && !s.highlighted)).toBe(true)
  })

  it("B: the first step is busy, not highlighted, and names the step in progress", () => {
    const [first] = welcomeSteps(at({ stage: "processing" }))
    expect(first).toMatchObject({ id: "show_progress", busy: true })
    expect(first?.highlighted).toBeFalsy()
    expect(first?.description).toBe(
      "Checking seasonal price lists… We'll email you when the draft is ready."
    )
  })

  it("B, long: promises a ready-by time instead of the step", () => {
    const [first] = welcomeSteps(
      at({ stage: "processing", processing: { activeStep: 1, long: true, readyBy: "4:00 PM" } })
    )
    expect(first?.description).toBe(
      "Your draft will be ready by 4:00 PM today at the latest. We'll email you."
    )
  })

  it("C: reviewing the draft is highlighted and summarises it", () => {
    const [first] = welcomeSteps(at({ stage: "draft_ready" }))
    expect(first).toMatchObject({ id: "review_draft", highlighted: true })
    expect(first?.description).toBe("3 categories · 26 units · 1 item needs your decision")
  })

  it("has at most one highlighted step", () => {
    for (const stage of ["awaiting_input", "processing", "draft_ready"] as const)
      expect(welcomeSteps(at({ stage })).filter((s) => s.highlighted).length).toBeLessThanOrEqual(1)
  })
})

describe("activeProcessingLabel", () => {
  it("clamps the step index to the list", () => {
    expect(activeProcessingLabel(at({ processing: { activeStep: 99, long: false } }))).toBe(
      "Preparing a draft for you to review"
    )
    expect(activeProcessingLabel(at({ processing: { activeStep: -1, long: false } }))).toBe(
      "Read bikesmallorca.com and price-list-2026.pdf"
    )
  })
})

describe("draftReadySummary", () => {
  it("pluralises and says when nothing is left to decide", () => {
    expect(draftReadySummary({ categories: 1, units: 1, addons: 0, openDecisions: 2 })).toBe(
      "1 category · 1 unit · 2 items need your decision"
    )
    expect(draftReadySummary({ categories: 3, units: 26, addons: 2, openDecisions: 0 })).toBe(
      "3 categories · 26 units · nothing left to decide"
    )
  })
})

describe("nextSteps (state D)", () => {
  const imported = at({ stage: "imported" })

  it("starts with finishing the settings while they're not done", () => {
    const steps = nextSteps(imported)
    expect(ids(steps)).toEqual([
      "finish_settings",
      "locations",
      "payments",
      "email_templates",
      "publish",
    ])
    expect(steps[0]).toMatchObject({ highlighted: true })
  })

  it("drops finished settings and a connected payment account", () => {
    expect(ids(nextSteps({ ...imported, settingsDone: true, paymentsConnected: true }))).toEqual([
      "locations",
      "email_templates",
      "publish",
    ])
  })

  it("never offers removing demo data — import does it", () => {
    expect(nextSteps(imported).some((s) => /demo/i.test(s.title))).toBe(false)
  })
})

describe("imported card", () => {
  it("title and summary without finished settings", () => {
    const status = at({ stage: "imported" })
    expect(importedTitle(status)).toBe("Your equipment and price lists are in the system")
    expect(importedSummary(status)).toBe("3 categories · 26 units · 2 add-ons · demo data removed")
  })

  it("title and summary follow the confirmed settings", () => {
    const done = at({ stage: "imported", settingsDone: true })
    expect(importedTitle(done)).toBe(
      "Your equipment, price lists and rental terms are in the system"
    )
    expect(importedSummary(done)).toBe(
      "3 categories · 26 units · 20% deposit · delivery · demo data removed"
    )
    expect(
      importedSummary({
        ...done,
        settings: { payMode: "full", depositPercent: 0, delivery: false },
      })
    ).toBe("3 categories · 26 units · full payment online · pickup only · demo data removed")
  })
})

describe("setup step 1", () => {
  it("needs the chosen source filled in", () => {
    expect(sourcesError("website", "  ", undefined)).toBe("Enter your website address.")
    expect(sourcesError("website", "bikesmallorca.com", undefined)).toBeUndefined()
    expect(sourcesError("file", "bikesmallorca.com", undefined)).toBe("Add your price list file.")
    expect(sourcesError("file", "", "prices.pdf")).toBeUndefined()
  })

  it("formats file sizes", () => {
    expect(formatFileSize(10)).toBe("1 KB")
    expect(formatFileSize(240 * 1024)).toBe("240 KB")
    expect(formatFileSize(1.25 * 1024 * 1024)).toBe("1.3 MB")
  })
})

describe("processingRows (setup step 2)", () => {
  it("marks steps before the active one done and after it pending", () => {
    const rows = processingRows(at({ processing: { activeStep: 2, long: false } }))
    expect(rows.map((r) => r.state)).toEqual([
      "done",
      "done",
      "active",
      "pending",
      "pending",
      "pending",
    ])
    expect(rows[0]?.label).toBe("Read bikesmallorca.com and price-list-2026.pdf")
  })
})
