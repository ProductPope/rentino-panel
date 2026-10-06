/**
 * Onboarding of a new rental business (rentinodev prototype, handoff "Onboarding nowego klienta").
 * The panel has no backend: the status comes from a mock (`src/mocks/onboarding.ts`).
 * UI code depends on these types only.
 */

/** Where the account is in onboarding — drives the Welcome page (states A–D). */
export type OnboardingStage =
  /** A — nothing sent yet; the account runs on demo data. */
  | "awaiting_input"
  /** B — we're preparing a draft from the customer's website or price list. */
  | "processing"
  /** C — the draft is ready for the customer to review and approve. */
  | "draft_ready"
  /** D — the draft was imported and replaced the demo data. */
  | "imported"

export interface OnboardingAccount {
  name: string
  city: string
  /** The customer's website, e.g. "bikesmallorca.com". */
  website: string
  /** File name of the uploaded price list, if any. */
  priceListFile?: string
  /** Where we email the customer when the draft is ready. */
  email: string
}

/** What the customer sends in step 1 of the setup wizard: a website address or a price list. */
export type SourcesInput = { kind: "website"; website: string } | { kind: "file"; fileName: string }

export interface OnboardingProcessing {
  /** When the sources were sent (ISO). Absent in forced demo states. */
  submittedAt?: string
  /** Index of the processing step in progress (see `processingSteps`). */
  activeStep: number
  /** The price list is large: the draft takes hours, not minutes. */
  long: boolean
  /** Latest time the draft will be ready, `HH:MM` (only for long processing). */
  readyBy?: string
}

/** What the draft contains — shown once it's ready and after import. */
export interface DraftSummary {
  categories: number
  units: number
  addons: number
  /** Values we couldn't find in the customer's sources; they need a decision. */
  openDecisions: number
}

export interface RentalSettings {
  payMode: "full" | "deposit"
  depositPercent: number
  delivery: boolean
}

export interface OnboardingStatus {
  stage: OnboardingStage
  account: OnboardingAccount
  processing: OnboardingProcessing
  draft: DraftSummary
  settings: RentalSettings
  /** Rental settings were confirmed (VAT included) in the setup wizard. */
  settingsDone: boolean
  /** A payment account (Stripe Connect) is connected. */
  paymentsConnected: boolean
}

export class OnboardingError extends Error {
  constructor(
    readonly reason: "unavailable",
    message: string
  ) {
    super(message)
    this.name = "OnboardingError"
  }
}

export interface OnboardingService {
  getStatus(): Promise<OnboardingStatus>
  /** Step 1 of the setup wizard: send a website or price list; preparing the draft starts. */
  submitSources(input: SourcesInput): Promise<OnboardingStatus>
}
