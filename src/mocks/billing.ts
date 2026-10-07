import type { BillingService, Subscription } from "@/lib/billing/types"

import { delay, mockScenario, persisted } from "./scenario"

const DAY = 24 * 60 * 60 * 1000

/**
 * Trial states, forced with `?mock=` (on top of `reset`):
 *   ?mock=trial-ending — 3 days left
 *   ?mock=trial-ended  — 0 of 30 days left
 * Without it, the stored state is used: a 30-day trial that started 9 days ago.
 */
const daysAgo = (days: number) => new Date(Date.now() - days * DAY).toISOString()

function forced(): Partial<Subscription> | null {
  if (typeof window === "undefined") return null
  const value = new URLSearchParams(window.location.search).get("mock")
  if (value === "trial-ending") return { trialStartedAt: daysAgo(27), plan: undefined }
  if (value === "trial-ended") return { trialStartedAt: daysAgo(31), plan: undefined }
  return null
}

const store = persisted<Subscription>("rentino.mock.billing", () => ({
  trialStartedAt: daysAgo(9),
  trialDays: 30,
}))

export const mockBillingService: BillingService = {
  async getSubscription() {
    if (mockScenario() === "reset") store.reset()
    await delay()
    return { ...store.read(), ...forced() }
  },

  async choosePlan(id, period) {
    await delay()
    // A backend would take the customer through checkout; the prototype just records the plan.
    const next: Subscription = { ...store.read(), plan: { id, period } }
    store.write(next)
    return next
  },
}
