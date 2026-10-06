import {
  OnboardingError,
  type OnboardingService,
  type OnboardingStatus,
} from "@/lib/onboarding/types"

import { delay, mockScenario, persisted } from "./scenario"

/**
 * Onboarding states, forced with `?mock=` (on top of `error` and `reset` from `scenario.ts`):
 *   ?mock=processing        — B, the draft is being prepared
 *   ?mock=processing-long   — B, a large price list: ready in a few hours
 *   ?mock=draft-ready       — C, the draft waits for review
 *   ?mock=imported          — D, imported; settings not finished, payments not connected
 *   ?mock=imported-settings — D, settings finished
 *   ?mock=imported-paid     — D, settings finished and payments connected
 * Without it, the stored state is used (A on first visit).
 */
const SCENARIOS = {
  processing: { stage: "processing" },
  "processing-long": {
    stage: "processing",
    processing: { activeStep: 3, long: true, readyBy: "4:00 PM" },
  },
  "draft-ready": { stage: "draft_ready" },
  imported: { stage: "imported" },
  "imported-settings": { stage: "imported", settingsDone: true },
  "imported-paid": { stage: "imported", settingsDone: true, paymentsConnected: true },
} satisfies Record<string, Partial<OnboardingStatus>>

type OnboardingScenario = keyof typeof SCENARIOS

function onboardingScenario(): OnboardingScenario | null {
  if (typeof window === "undefined") return null
  const value = new URLSearchParams(window.location.search).get("mock")
  return value && value in SCENARIOS ? (value as OnboardingScenario) : null
}

/**
 * Preparing the draft, simulated (a backend would report it): a step is done every
 * `STEP_MS` until "Checking seasonal price lists", then the draft is ready after `READY_MS`
 * — the moment the customer would get the email.
 */
export const SIMULATION = { STEP_MS: 1100, LAST_RUNNING_STEP: 3, READY_MS: 15_000 }

export function simulatedProgress(elapsedMs: number) {
  if (elapsedMs >= SIMULATION.READY_MS)
    return { ready: true, activeStep: SIMULATION.LAST_RUNNING_STEP }
  const activeStep = Math.min(
    Math.floor(elapsedMs / SIMULATION.STEP_MS),
    SIMULATION.LAST_RUNNING_STEP
  )
  return { ready: false, activeStep }
}

function seed(): OnboardingStatus {
  return {
    stage: "awaiting_input",
    account: {
      name: "Bikes Mallorca",
      city: "Palma de Mallorca",
      website: "bikesmallorca.com",
      priceListFile: "price-list-2026.pdf",
      email: "marek@bikesmallorca.com",
    },
    processing: { activeStep: 3, long: false },
    draft: { categories: 3, units: 26, addons: 2, openDecisions: 1 },
    settings: { payMode: "deposit", depositPercent: 20, delivery: true },
    settingsDone: false,
    paymentsConnected: false,
  }
}

const store = persisted<OnboardingStatus>("rentino.mock.onboarding", seed)

/** The stored status, with preparing advanced to now (and finished when it's time). */
function current(now = Date.now()): OnboardingStatus {
  const status = store.read()
  const { submittedAt } = status.processing
  if (status.stage !== "processing" || !submittedAt) return status
  const progress = simulatedProgress(now - Date.parse(submittedAt))
  const next: OnboardingStatus = {
    ...status,
    stage: progress.ready ? "draft_ready" : "processing",
    processing: { ...status.processing, activeStep: progress.activeStep },
  }
  if (progress.ready) store.write(next)
  return next
}

export const mockOnboardingService: OnboardingService = {
  async getStatus() {
    const scenario = mockScenario()
    if (scenario === "reset") store.reset()
    await delay()
    if (scenario === "error")
      throw new OnboardingError("unavailable", "The server didn't respond. Try again.")
    const forced = onboardingScenario()
    return forced ? { ...current(), ...SCENARIOS[forced] } : current()
  },

  async submitSources(input) {
    await delay()
    const status = store.read()
    const next: OnboardingStatus = {
      ...status,
      stage: "processing",
      account: {
        ...status.account,
        ...(input.kind === "website"
          ? { website: input.website.trim(), priceListFile: undefined }
          : { priceListFile: input.fileName }),
      },
      processing: { submittedAt: new Date().toISOString(), activeStep: 0, long: false },
    }
    store.write(next)
    return next
  },
}
