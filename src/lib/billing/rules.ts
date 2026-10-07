import type { BillingPeriod, Plan, PlanId, Subscription } from "./types"

/** Annual billing takes 20% off the monthly price. */
export const ANNUAL_DISCOUNT = 20

export const PLANS: Plan[] = [
  { id: "a", name: "Plan A", monthly: 49, branches: 1, logins: 1 },
  { id: "b", name: "Plan B", monthly: 99, branches: 1, logins: 5, popular: true },
  { id: "c", name: "Plan C", monthly: 199, branches: 3, logins: 10 },
  { id: "unlimited", name: "Unlimited", monthly: null, branches: "unlimited", logins: "unlimited" },
]

export const planById = (id: PlanId) => PLANS.find((p) => p.id === id)

/** Price per month for a period: annual is 20% off, rounded down to whole dollars ($99 → $79). */
export function monthlyPrice(plan: Plan, period: BillingPeriod) {
  if (plan.monthly == null) return null
  return period === "annual" ? Math.floor(plan.monthly * (1 - ANNUAL_DISCOUNT / 100)) : plan.monthly
}

/** What a year costs on annual billing. */
export function annualTotal(plan: Plan) {
  const perMonth = monthlyPrice(plan, "annual")
  return perMonth == null ? null : perMonth * 12
}

const DAY = 24 * 60 * 60 * 1000

/** Days left of the trial (whole days, never below 0), when it ends, and whether it has. */
export function trialStatus(
  sub: Pick<Subscription, "trialStartedAt" | "trialDays">,
  now = new Date()
) {
  const start = new Date(sub.trialStartedAt)
  const endsAt = new Date(start.getTime() + sub.trialDays * DAY)
  const daysLeft = Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / DAY))
  return { daysLeft, daysTotal: sub.trialDays, endsAt, ended: daysLeft === 0 }
}

/** The trial bar shows until a paid plan is chosen. */
export const showsTrial = (sub: Subscription) => sub.plan == null
