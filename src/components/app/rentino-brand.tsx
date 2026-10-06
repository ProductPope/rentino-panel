import { BikeIcon } from "lucide-react"
import Link from "next/link"

/**
 * Rentino logo for the sidebar. Placeholder mark (as in EQ's RentinoBrand) until EQ-librium
 * ships the real logo; brand violet is used here and nowhere else.
 */
export function RentinoBrand() {
  return (
    <Link
      href="/"
      className="flex h-9 items-center gap-2 rounded-md px-1 text-sidebar-foreground outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sidebar-ring focus-visible:outline-solid"
    >
      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-brand text-white">
        <BikeIcon className="size-4" aria-hidden="true" />
      </span>
      <span className="truncate font-semibold group-data-[collapsible=icon]:sr-only">Rentino</span>
    </Link>
  )
}
