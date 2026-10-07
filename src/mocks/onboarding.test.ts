import { afterEach, describe, expect, it, vi } from "vitest"

import { emptyPricing } from "@/lib/onboarding/pricing"

import { mockOnboardingService, SIMULATION, simulatedProgress } from "./onboarding"

function visit(search: string) {
  vi.stubGlobal("window", { location: { search } })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("mock onboarding service", () => {
  it("starts in state A on demo data", async () => {
    const status = await mockOnboardingService.getStatus()
    expect(status.stage).toBe("awaiting_input")
    expect(status.settingsDone).toBe(false)
    expect(status.paymentsConnected).toBe(false)
  })

  it("forces a state with ?mock=", async () => {
    visit("?mock=imported-paid")
    const status = await mockOnboardingService.getStatus()
    expect(status.stage).toBe("imported")
    expect(status.settingsDone).toBe(true)
    expect(status.paymentsConnected).toBe(true)
  })

  it("long processing comes with a ready-by time", async () => {
    visit("?mock=processing-long")
    const status = await mockOnboardingService.getStatus()
    expect(status.processing).toMatchObject({ long: true, readyBy: "4:00 PM" })
  })

  it("fails like a backend would with ?mock=error", async () => {
    visit("?mock=error")
    await expect(mockOnboardingService.getStatus()).rejects.toThrow("didn't respond")
  })

  it("ignores unknown scenarios", async () => {
    visit("?mock=empty")
    expect((await mockOnboardingService.getStatus()).stage).toBe("awaiting_input")
  })
})

describe("simulated preparing", () => {
  it("advances a step at a time, stops at the last running step, then is ready", () => {
    expect(simulatedProgress(0)).toEqual({ ready: false, activeStep: 0 })
    expect(simulatedProgress(SIMULATION.STEP_MS * 2 + 1)).toEqual({ ready: false, activeStep: 2 })
    expect(simulatedProgress(SIMULATION.READY_MS - 1)).toEqual({
      ready: false,
      activeStep: SIMULATION.LAST_RUNNING_STEP,
    })
    expect(simulatedProgress(SIMULATION.READY_MS).ready).toBe(true)
  })

  it("sending a price list starts preparing and the draft is ready later", async () => {
    vi.useFakeTimers({ toFake: ["Date", "setTimeout"] })
    try {
      const sent = mockOnboardingService.submitSources({ fileName: "prices.xlsx" })
      await vi.runAllTimersAsync()
      const status = await sent
      expect(status).toMatchObject({
        stage: "processing",
        account: { priceListFile: "prices.xlsx" },
      })

      vi.setSystemTime(Date.now() + SIMULATION.READY_MS)
      const later = mockOnboardingService.getStatus()
      await vi.runAllTimersAsync()
      expect((await later).stage).toBe("draft_ready")
    } finally {
      vi.useRealTimers()
    }
  })
})

describe("equipment added by hand", () => {
  const input = {
    name: "City bike",
    parentCategory: "Bikes",
    units: 14,
    codePrefix: "BIK",
    pricing: { ...emptyPricing(), daily: [{ id: "d", from: 1, to: null, price: 18 }] },
  }

  it("starts with three demo examples and can't be approved with only those", async () => {
    visit("?mock=reset")
    await mockOnboardingService.getStatus()
    vi.unstubAllGlobals()
    const items = await mockOnboardingService.listEquipment()
    expect(items.map((i) => i.name)).toEqual([
      "Trek Marlin 7 Mountain Bike",
      "Club Car Tempo",
      "Wilson Pro Staff RF97 Autograph",
    ])
    expect(items.every((i) => i.demo)).toBe(true)
    await expect(mockOnboardingService.importEquipment()).rejects.toMatchObject({
      reason: "nothing_to_import",
    })
  })

  it("adds, edits, removes and puts back an item", async () => {
    const added = await mockOnboardingService.addEquipment(input)
    await mockOnboardingService.putEquipment({ ...added, units: 20 })
    expect((await mockOnboardingService.listEquipment()).at(-1)?.units).toBe(20)
    await mockOnboardingService.removeEquipment(added.id)
    expect((await mockOnboardingService.listEquipment()).some((i) => i.id === added.id)).toBe(false)
    await mockOnboardingService.putEquipment(added)
    expect((await mockOnboardingService.listEquipment()).some((i) => i.id === added.id)).toBe(true)
  })

  it("approving drops the demo examples and counts only the customer's items", async () => {
    const status = await mockOnboardingService.importEquipment()
    expect(status.stage).toBe("imported")
    expect(status.draft).toEqual({ categories: 1, units: 14, addons: 0, openDecisions: 0 })
    const items = await mockOnboardingService.listEquipment()
    expect(items.map((i) => i.name)).toEqual(["City bike"])
  })
})

describe("rental settings", () => {
  it("can't be saved before import or without VAT confirmed; then marks settings done", async () => {
    visit("?mock=reset")
    const status = await mockOnboardingService.getStatus()
    vi.unstubAllGlobals()
    const confirmed = { ...status.settings, vatConfirmed: true }
    await expect(mockOnboardingService.saveSettings(confirmed)).rejects.toMatchObject({
      reason: "not_imported",
    })

    visit("?mock=imported")
    await expect(mockOnboardingService.saveSettings(status.settings)).rejects.toMatchObject({
      reason: "vat_not_confirmed",
    })
    const saved = await mockOnboardingService.saveSettings({ ...confirmed, payMode: "full" })
    expect(saved).toMatchObject({ stage: "imported", settingsDone: true })
    vi.unstubAllGlobals()
    expect((await mockOnboardingService.getStatus()).settings.payMode).toBe("full")
  })
})

describe("payments", () => {
  it("connect only after import; then the checklist drops the step", async () => {
    visit("?mock=reset")
    await mockOnboardingService.getStatus()
    vi.unstubAllGlobals()
    await expect(mockOnboardingService.connectPayments()).rejects.toMatchObject({
      reason: "not_imported",
    })
    visit("?mock=imported")
    expect(await mockOnboardingService.connectPayments()).toMatchObject({
      paymentsConnected: true,
    })
  })
})

describe("forced states", () => {
  it("settings done implies a confirmed VAT rate", async () => {
    visit("?mock=imported-settings")
    expect((await mockOnboardingService.getStatus()).settings.vatConfirmed).toBe(true)
  })
})

describe("saved before price lists", () => {
  it("reads an old daily/weekly item as a price list", async () => {
    const legacy = [
      {
        id: "old",
        name: "Kayak",
        category: "Kayaks",
        units: 2,
        codePrefix: "KAY",
        pricePerDay: 40,
        pricePerWeek: 200,
      },
    ]
    const storage = new Map([["rentino.mock.equipment", JSON.stringify(legacy)]])
    vi.stubGlobal("window", {
      location: { search: "" },
      localStorage: {
        getItem: (k: string) => storage.get(k) ?? null,
        setItem: () => {},
        removeItem: () => {},
      },
    })
    const [item] = await mockOnboardingService.listEquipment()
    expect(item?.parentCategory).toBe("Kayaks")
    expect(item).not.toHaveProperty("category")
    expect(item?.pricing).toMatchObject({
      daily: [{ from: 1, to: null, price: 40 }],
      weekly: [{ from: 1, to: null, price: 200 }],
    })
  })
})
