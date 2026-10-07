import { mockBillingService } from "@/mocks/billing"

import type { BillingService } from "./types"

export * from "./rules"
export * from "./types"

/** The billing service the app uses. Swap the mock for a real implementation here. */
export const billingService: BillingService = mockBillingService
