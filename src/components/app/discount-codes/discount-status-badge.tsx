import { Badge } from "@/components/ui/badge"
import { STATUS_LABEL, type DiscountStatus } from "@/lib/discount-codes"

/**
 * Discount-code status. EQ's StatusBadge has no `discountCode` domain yet (requested from
 * EQ-librium); until then the tones follow EQ's template-discount-codes example.
 */
const TONE: Record<DiscountStatus, "success" | "info" | "secondary" | "outline"> = {
  active: "success",
  scheduled: "info",
  expired: "secondary",
  inactive: "outline",
}

export function DiscountStatusBadge({ status }: { status: DiscountStatus }) {
  return <Badge variant={TONE[status]}>{STATUS_LABEL[status]}</Badge>
}
