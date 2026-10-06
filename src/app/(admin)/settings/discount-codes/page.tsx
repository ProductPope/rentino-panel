import { LockIcon } from "lucide-react"
import type { Metadata } from "next"

import { DiscountCodesView } from "@/components/app/discount-codes/discount-codes-view"
import { EmptyState } from "@/components/eq/empty-state"
import { PageHeader } from "@/components/eq/page-header"
import { can, sessionService } from "@/lib/session"

export const metadata: Metadata = { title: "Discount codes" }

export default async function DiscountCodesPage() {
  const { user } = await sessionService.getSession()
  if (can(user, "discount_codes.manage")) return <DiscountCodesView />

  return (
    <div className="flex flex-col gap-(--eq-page-header-gap)">
      <PageHeader title="Discount codes" />
      <EmptyState
        icon={<LockIcon />}
        title="You don't have access to discount codes"
        description="Ask an owner to give your role the “Manage discount codes” permission in Settings → Roles."
      />
    </div>
  )
}
