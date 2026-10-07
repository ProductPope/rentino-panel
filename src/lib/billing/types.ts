/**
 * The account's trial and plan. No backend: the subscription comes from a mock
 * (`src/mocks/billing.ts`). UI code depends on these types only.
 */
export type BillingPeriod = "monthly" | "annual"

export interface Subscription {
  /** When the free trial started (ISO). */
  trialStartedAt: string
  trialDays: number
  /** Set once the customer picks a paid plan. */
  plan?: { id: PlanId; period: BillingPeriod }
}

export type PlanId = "a" | "b" | "c" | "unlimited"

export interface Plan {
  id: PlanId
  name: string
  /** Price per month when billed monthly; `null` = price on request. */
  monthly: number | null
  branches: number | "unlimited"
  logins: number | "unlimited"
  popular?: boolean
}

export interface BillingService {
  getSubscription(): Promise<Subscription>
  /** Pick a paid plan (in the product: checkout; here simulated). */
  choosePlan(id: PlanId, period: BillingPeriod): Promise<Subscription>
}
