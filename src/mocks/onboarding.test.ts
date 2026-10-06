import { afterEach, describe, expect, it, vi } from "vitest"

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

  it("sending a website starts preparing and the draft is ready later", async () => {
    vi.useFakeTimers({ toFake: ["Date", "setTimeout"] })
    try {
      const sent = mockOnboardingService.submitSources({
        kind: "website",
        website: " shop.example ",
      })
      await vi.runAllTimersAsync()
      const status = await sent
      expect(status).toMatchObject({ stage: "processing", account: { website: "shop.example" } })
      expect(status.account.priceListFile).toBeUndefined()

      vi.setSystemTime(Date.now() + SIMULATION.READY_MS)
      const later = mockOnboardingService.getStatus()
      await vi.runAllTimersAsync()
      expect((await later).stage).toBe("draft_ready")
    } finally {
      vi.useRealTimers()
    }
  })
})
