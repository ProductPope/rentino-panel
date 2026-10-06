import { afterEach, describe, expect, it, vi } from "vitest"

import { mockOnboardingService } from "./onboarding"

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
