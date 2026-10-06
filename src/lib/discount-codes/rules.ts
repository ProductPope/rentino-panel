import { formatDate, formatMoney, today as todayIso } from "@/lib/tenant"

import type { DiscountCode, DiscountStatus, DiscountType } from "./types"

export function statusOf(
  code: Pick<DiscountCode, "active" | "validFrom" | "validTo">,
  today = todayIso()
): DiscountStatus {
  if (!code.active) return "inactive"
  if (code.validFrom && today < code.validFrom) return "scheduled"
  if (code.validTo && today > code.validTo) return "expired"
  return "active"
}

/** Only codes never used on an order can be deleted; used ones can only be deactivated. */
export const canDelete = (code: Pick<DiscountCode, "uses">) => code.uses === 0

export const TYPE_LABEL: Record<DiscountType, string> = {
  percentage: "Percentage",
  fixed: "Fixed amount",
}

export const STATUS_LABEL: Record<DiscountStatus, string> = {
  active: "Active",
  scheduled: "Scheduled",
  expired: "Expired",
  inactive: "Inactive",
}

export function formatValue(code: Pick<DiscountCode, "type" | "value">) {
  return code.type === "percentage"
    ? `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(code.value)}%`
    : formatMoney(code.value)
}

export function formatValidity(code: Pick<DiscountCode, "validFrom" | "validTo">) {
  const { validFrom: from, validTo: to } = code
  if (from && to) return `${formatDate(from)} – ${formatDate(to)}`
  if (from) return `From ${formatDate(from)}`
  if (to) return `Until ${formatDate(to)}`
  return "No end date"
}

/** Case-insensitive match on the code and the internal note. */
export function matchesQuery(code: Pick<DiscountCode, "code" | "description">, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return code.code.toLowerCase().includes(q) || !!code.description?.toLowerCase().includes(q)
}
