import { mockOnboardingService } from "@/mocks/onboarding"

import type { OnboardingService } from "./types"

export * from "./equipment"
export * from "./rules"
export * from "./types"

/** The onboarding service the app uses. Swap the mock for a real implementation here. */
export const onboardingService: OnboardingService = mockOnboardingService
