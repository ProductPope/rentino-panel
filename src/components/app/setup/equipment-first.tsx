import { ArrowRightIcon, TriangleAlertIcon } from "lucide-react"
import Link from "next/link"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import { SETUP_SOURCES_HREF } from "@/config/navigation"

/** Shown by steps that need approved equipment (4 and 5) when it isn't there yet. */
export function EquipmentFirst({ what }: { what: string }) {
  return (
    <Alert variant="info">
      <TriangleAlertIcon aria-hidden="true" />
      <AlertTitle>Add your equipment first</AlertTitle>
      <AlertDescription>
        <p>{what} come after your equipment and prices are approved.</p>
        <div>
          <Link
            href={SETUP_SOURCES_HREF}
            className={buttonVariants({ size: "sm", variant: "outline" })}
          >
            Add equipment
            <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
          </Link>
        </div>
      </AlertDescription>
    </Alert>
  )
}
