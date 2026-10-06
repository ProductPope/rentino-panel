import { mockDiscountCodeRepository } from "@/mocks/discount-codes"

import type { DiscountCodeRepository } from "./types"

export * from "./rules"
export * from "./types"

/** The repository the app uses. Swap the mock for a real implementation here. */
export const discountCodeRepository: DiscountCodeRepository = mockDiscountCodeRepository
