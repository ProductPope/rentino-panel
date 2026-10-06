import type * as React from "react"

import { Badge } from "@/components/ui/badge"

type Tone = "success" | "info" | "warning" | "destructive" | "secondary" | "outline"

/**
 * One mapping from domain statuses to tones and labels, so "Reserved" looks the same on every screen.
 * Add statuses here, never by picking a Badge variant ad hoc.
 */
export const STATUS_MAP = {
  order: {
    new: { tone: "info", label: "New" },
    confirmed: { tone: "info", label: "Confirmed" },
    in_rental: { tone: "success", label: "In rental" },
    returned: { tone: "secondary", label: "Returned" },
    overdue: { tone: "destructive", label: "Overdue" },
    cancelled: { tone: "outline", label: "Cancelled" },
  },
  equipment: {
    available: { tone: "success", label: "Available" },
    reserved: { tone: "info", label: "Reserved" },
    rented: { tone: "info", label: "Rented" },
    in_service: { tone: "warning", label: "In service" },
    damaged: { tone: "destructive", label: "Damaged" },
    retired: { tone: "secondary", label: "Retired" },
  },
  payment: {
    paid: { tone: "success", label: "Paid" },
    partially_paid: { tone: "warning", label: "Partially paid" },
    unpaid: { tone: "destructive", label: "Unpaid" },
    pending: { tone: "info", label: "Pending" },
    refunded: { tone: "secondary", label: "Refunded" },
  },
} as const satisfies Record<string, Record<string, { tone: Tone; label: string }>>

export type StatusDomain = keyof typeof STATUS_MAP
export type StatusOf<D extends StatusDomain> = keyof (typeof STATUS_MAP)[D]

export interface StatusBadgeProps<D extends StatusDomain> extends Omit<
  React.ComponentProps<typeof Badge>,
  "variant" | "children"
> {
  domain: D
  status: StatusOf<D>
  /** Override the label (e.g. translated). The tone always comes from the map. */
  label?: string
}

/** A Badge whose tone and label come from the domain status map. */
function StatusBadge<D extends StatusDomain>({
  domain,
  status,
  label,
  ...props
}: StatusBadgeProps<D>) {
  const entry = (STATUS_MAP[domain] as Record<PropertyKey, { tone: Tone; label: string }>)[
    status as PropertyKey
  ]
  if (!entry)
    throw new Error(`StatusBadge: unknown status "${String(status)}" for domain "${domain}"`)
  return (
    <Badge data-slot="status-badge" data-status={String(status)} variant={entry.tone} {...props}>
      {label ?? entry.label}
    </Badge>
  )
}

export { StatusBadge }
