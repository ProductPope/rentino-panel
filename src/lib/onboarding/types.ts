import type { EquipmentInput, EquipmentItem } from "./equipment"

/**
 * Onboarding of a new rental business (rentinodev prototype, handoff "Onboarding nowego klienta").
 * The panel has no backend: the status comes from a mock (`src/mocks/onboarding.ts`).
 * UI code depends on these types only.
 */

/** Where the account is in onboarding — drives the Welcome page (states A–D). */
export type OnboardingStage =
  /** A — nothing sent yet; the account runs on demo data. */
  | "awaiting_input"
  /** B — we're preparing a draft from the customer's price list. */
  | "processing"
  /** C — the draft is ready for the customer to review and approve. */
  | "draft_ready"
  /** D — the draft was imported and replaced the demo data. */
  | "imported"

export interface OnboardingAccount {
  name: string
  city: string
  /** File name of the uploaded price list, if any. */
  priceListFile?: string
  /** Where we email the customer when the draft is ready. */
  email: string
}

/** What the customer sends in step 1 of the setup wizard when they choose a price list file. */
export interface SourcesInput {
  fileName: string
}

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

/** Rental terms from setup step 4. Amounts are in the tenant currency. */
export interface RentalSettings {
  payMode: "full" | "deposit"
  /** Share paid at booking when `payMode` is "deposit". */
  depositPercent: number
  /** The rest is charged this many days before pickup. */
  restDaysBefore: number
  delivery: boolean
  /** Delivery is free from this many rental days. */
  freeFromDays: number
  deliveryFee: number
  /** Optional: a price per km instead of the flat fee. */
  perKmFee: number | null
  vatRate: number
  vatCountry: string
  /** Tax settings are the customer's responsibility, so we always ask. */
  vatConfirmed: boolean
  /** Optional surcharge for card payments, in %. */
  cardFeePercent: number | null
  /** Customers sign the rental terms when they book. */
  signatureRequired: boolean
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
    readonly reason: "unavailable" | "nothing_to_import" | "vat_not_confirmed" | "not_imported",
    message: string
  ) {
    super(message)
    this.name = "OnboardingError"
  }
}

export interface OnboardingService {
  getStatus(): Promise<OnboardingStatus>
  /** Step 1 of the setup wizard: send a price list; preparing the draft starts. */
  submitSources(input: SourcesInput): Promise<OnboardingStatus>
  /** Equipment added by hand; starts with three demo examples. */
  listEquipment(): Promise<EquipmentItem[]>
  addEquipment(input: EquipmentInput): Promise<EquipmentItem>
  /** Replaces an item, or puts a removed one back (undo). */
  putEquipment(item: EquipmentItem): Promise<EquipmentItem>
  removeEquipment(id: string): Promise<void>
  /** Step 4: save the rental terms. Needs the VAT rate confirmed; marks the settings done. */
  saveSettings(settings: RentalSettings): Promise<OnboardingStatus>
  /**
   * Approve the equipment added by hand: it replaces the demo data (demo examples are dropped).
   * Fails without at least one item of the customer's own.
   */
  importEquipment(): Promise<OnboardingStatus>
}
