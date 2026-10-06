import { ArrowLeftIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { PageHeader } from "@/components/eq/page-header"
import { Button } from "@/components/ui/button"
import { DISCOUNT_CODES_HREF } from "@/config/navigation"

export const metadata: Metadata = { title: "Booking page" }

/** Stand-in for the tenant's public booking page, which lives outside this panel. */
export default function BookingPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-(--eq-page-padding)">
      <PageHeader
        title="Booking page"
        description="Your public booking page opens here. It is not part of this demo yet."
      />
      <div>
        <Button variant="outline" nativeButton={false} render={<Link href={DISCOUNT_CODES_HREF} />}>
          <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
          Back to the panel
        </Button>
      </div>
    </main>
  )
}
