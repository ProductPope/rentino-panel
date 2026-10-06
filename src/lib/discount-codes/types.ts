/**
 * Discount codes (Jira WHLZ-566). The UI depends on these types and on `DiscountCodeRepository`;
 * the implementation is a mock until there is a backend.
 */

export type DiscountType = "percentage" | "fixed"

/** Derived from `active` and the validity dates — never stored. */
export type DiscountStatus = "active" | "scheduled" | "expired" | "inactive"

export interface DiscountCode {
  id: string
  /** A–Z, 0–9, "-" and "_", stored upper-case; unique per tenant, case-insensitive. */
  code: string
  type: DiscountType
  /** Percentage 0.01–100, or an amount > 0 in the tenant currency. */
  value: number
  /** `YYYY-MM-DD`, inclusive. Optional: without dates the code never expires. */
  validFrom?: string
  validTo?: string
  active: boolean
  /** Internal note, visible to the team only. */
  description?: string
  /** Read-only: how many orders used the code. A used code can be deactivated, not deleted. */
  uses: number
  createdAt: string
  updatedAt: string
}

export type DiscountCodeErrorReason = "not_found" | "in_use" | "duplicate_code" | "unavailable"

/** A failure the UI can explain. `message` is user-facing. */
export class DiscountCodeError extends Error {
  constructor(
    readonly reason: DiscountCodeErrorReason,
    message: string
  ) {
    super(message)
    this.name = "DiscountCodeError"
  }
}

export interface DiscountCodeRepository {
  list(): Promise<DiscountCode[]>
  /** Turn a code on or off; returns the updated code. */
  setActive(id: string, active: boolean): Promise<DiscountCode>
  /** Delete an unused code. Rejects with `in_use` when the code was used. */
  remove(id: string): Promise<void>
}
