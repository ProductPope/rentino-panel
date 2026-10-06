import type { DiscountCode, DiscountCodeInput, DiscountType } from "./types"

/** What the form holds: text as typed. */
export interface DiscountCodeDraft {
  code: string
  type: DiscountType
  value: string
  validFrom?: string
  validTo?: string
  active: boolean
  description: string
}

export type DiscountCodeField = "code" | "value" | "validity"
export type DiscountCodeErrors = Partial<Record<DiscountCodeField, string>>

export const CODE_PATTERN = /^[A-Z0-9_-]+$/
export const CODE_MAX_LENGTH = 32

/** What clients type, as it is stored: upper-case, no spaces. */
export const normalizeCode = (raw: string) => raw.toUpperCase().replace(/\s+/g, "")

/** Parses "12,5" and "12.5"; NaN when it isn't a number. */
export function parseAmount(raw: string) {
  const text = raw.trim().replace(",", ".")
  return /^\d+(\.\d+)?$/.test(text) ? Number(text) : Number.NaN
}

export const isDuplicateCode = (
  code: string,
  existing: Pick<DiscountCode, "id" | "code">[],
  ownId?: string
) => existing.some((c) => c.id !== ownId && c.code.toLowerCase() === code.toLowerCase())

/** WHLZ-566 field rules. Messages say what is wrong and how to fix it. */
export function validateDiscountCode(
  draft: DiscountCodeDraft,
  existing: Pick<DiscountCode, "id" | "code">[] = [],
  ownId?: string
): DiscountCodeErrors {
  const errors: DiscountCodeErrors = {}
  const code = normalizeCode(draft.code)

  if (!code) errors.code = "Enter a code."
  else if (!CODE_PATTERN.test(code)) errors.code = "Use only letters A–Z, digits 0–9, “-” and “_”."
  else if (code.length > CODE_MAX_LENGTH) errors.code = `Use at most ${CODE_MAX_LENGTH} characters.`
  else if (isDuplicateCode(code, existing, ownId))
    errors.code = `A code “${code}” already exists. Choose another one.`

  const value = parseAmount(draft.value)
  if (!draft.value.trim()) errors.value = "Enter a value."
  else if (Number.isNaN(value)) errors.value = "Enter a number, e.g. 10 or 12.5."
  else if (draft.type === "percentage" && (value < 0.01 || value > 100))
    errors.value = "Percentage must be between 0.01 and 100."
  else if (draft.type === "fixed" && value <= 0) errors.value = "Amount must be greater than 0."
  else if (Math.round(value * 100) !== value * 100) errors.value = "Use at most 2 decimal places."

  if (draft.validFrom && draft.validTo && draft.validTo < draft.validFrom)
    errors.validity = "The end date can't be before the start date."

  return errors
}

export function toInput(draft: DiscountCodeDraft): DiscountCodeInput {
  const description = draft.description.trim()
  return {
    code: normalizeCode(draft.code),
    type: draft.type,
    value: parseAmount(draft.value),
    validFrom: draft.validFrom || undefined,
    validTo: draft.validTo || undefined,
    active: draft.active,
    description: description || undefined,
  }
}

export function toDraft(code?: DiscountCode): DiscountCodeDraft {
  return {
    code: code?.code ?? "",
    type: code?.type ?? "percentage",
    value: code ? String(code.value) : "",
    validFrom: code?.validFrom,
    validTo: code?.validTo,
    active: code?.active ?? true,
    description: code?.description ?? "",
  }
}
