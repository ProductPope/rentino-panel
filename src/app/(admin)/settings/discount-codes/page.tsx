import type { Metadata } from "next"

import { PageHeader } from "@/components/eq/page-header"

export const metadata: Metadata = { title: "Discount codes" }

export default function DiscountCodesPage() {
  return (
    <PageHeader
      title="Discount codes"
      description="Reusable codes clients enter at checkout, or you add to an order."
    />
  )
}
