import { equipmentTotals, type EquipmentItem } from "@/lib/onboarding/equipment"
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

/** A forced state over the stored one. "Settings done" implies a confirmed VAT rate. */
function withScenario(status: OnboardingStatus, forced: OnboardingScenario | null) {
  if (!forced) return status
  const next: OnboardingStatus = { ...status, ...SCENARIOS[forced] }
  return next.settingsDone ? { ...next, settings: { ...next.settings, vatConfirmed: true } } : next
}

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
      priceListFile: "price-list-2026.pdf",
      email: "marek@bikesmallorca.com",
    },
    processing: { activeStep: 3, long: false },
    draft: { categories: 3, units: 26, addons: 2, openDecisions: 1 },
    settings: {
      payMode: "deposit",
      depositPercent: 20,
      restDaysBefore: 2,
      delivery: true,
      freeFromDays: 3,
      deliveryFee: 10,
      perKmFee: null,
      vatRate: 21,
      vatCountry: "Spain",
      vatConfirmed: false,
      cardFeePercent: null,
      signatureRequired: true,
    },
    settingsDone: false,
    paymentsConnected: false,
  }
}

const store = persisted<OnboardingStatus>("rentino.mock.onboarding", seed)

/** Three examples on demo data to start from (the customer can remove them). */
function seedEquipment(): EquipmentItem[] {
  return [
    {
      id: "demo-trek-marlin-7",
      name: "Trek Marlin 7 Mountain Bike",
      category: "Bikes",
      units: 1,
      codePrefix: "BIK",
      pricePerDay: 35,
      pricePerWeek: 180,
      photoUrl: "/demo/equipment/trek-marlin-7.webp",
      demo: true,
    },
    {
      id: "demo-club-car-tempo",
      name: "Club Car Tempo",
      category: "Golf carts",
      units: 1,
      codePrefix: "GLF",
      pricePerDay: 120,
      pricePerWeek: 650,
      photoUrl: "/demo/equipment/club-car-tempo.webp",
      demo: true,
    },
    {
      id: "demo-wilson-pro-staff-rf97",
      name: "Wilson Pro Staff RF97 Autograph",
      category: "Tennis rackets",
      units: 1,
      codePrefix: "TNS",
      pricePerDay: 12,
      pricePerWeek: 60,
      photoUrl: "/demo/equipment/wilson-pro-staff-rf97.webp",
      demo: true,
    },
  ]
}

const equipment = persisted<EquipmentItem[]>("rentino.mock.equipment", seedEquipment)

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
    if (scenario === "reset") {
      store.reset()
      equipment.reset()
    }
    await delay()
    if (scenario === "error")
      throw new OnboardingError("unavailable", "The server didn't respond. Try again.")
    const forced = onboardingScenario()
    return withScenario(current(), forced)
  },

  async submitSources(input) {
    await delay()
    const status = store.read()
    const next: OnboardingStatus = {
      ...status,
      stage: "processing",
      account: { ...status.account, priceListFile: input.fileName },
      processing: { submittedAt: new Date().toISOString(), activeStep: 0, long: false },
    }
    store.write(next)
    return next
  },

  async listEquipment() {
    await delay()
    return equipment.read()
  },

  async addEquipment(input) {
    await delay()
    const item: EquipmentItem = { ...input, id: `eq-${crypto.randomUUID()}` }
    equipment.write([...equipment.read(), item])
    return item
  },

  async putEquipment(item) {
    await delay()
    const items = equipment.read()
    equipment.write(
      items.some((i) => i.id === item.id)
        ? items.map((i) => (i.id === item.id ? item : i))
        : [...items, item]
    )
    return item
  },

  async removeEquipment(id) {
    await delay()
    equipment.write(equipment.read().filter((i) => i.id !== id))
  },

  async saveSettings(settings) {
    await delay()
    // A forced demo state counts as the current one, so `?mock=imported` can save too.
    const forced = onboardingScenario()
    const status = withScenario(store.read(), forced)
    if (status.stage !== "imported")
      throw new OnboardingError("not_imported", "Approve your equipment first.")
    if (!settings.vatConfirmed)
      throw new OnboardingError("vat_not_confirmed", "Confirm the VAT rate to continue.")
    const next: OnboardingStatus = { ...status, settings, settingsDone: true }
    store.write(next)
    return next
  },

  async connectPayments() {
    await delay()
    const forced = onboardingScenario()
    const status = withScenario(store.read(), forced)
    if (status.stage !== "imported")
      throw new OnboardingError("not_imported", "Approve your equipment first.")
    // A backend would hand over to Stripe Connect and come back; the prototype just connects.
    const next: OnboardingStatus = { ...status, paymentsConnected: true }
    store.write(next)
    return next
  },

  async importEquipment() {
    await delay()
    const totals = equipmentTotals(equipment.read())
    if (totals.items === 0)
      throw new OnboardingError(
        "nothing_to_import",
        "Add at least one item of your own — demo examples aren't saved."
      )
    // Approving replaces the demo data: the examples go, the customer's items stay.
    equipment.write(equipment.read().filter((i) => !i.demo))
    const next: OnboardingStatus = {
      ...store.read(),
      stage: "imported",
      draft: { categories: totals.categories, units: totals.units, addons: 0, openDecisions: 0 },
    }
    store.write(next)
    return next
  },
}
