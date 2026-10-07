import Link from "next/link"

import { RentinoLogo } from "@/components/eq/rentino-logo"

/**
 * Rentino logo linking home (EQ `RentinoBrand`). The logo's alt text ("Rentino") is the link's
 * name; in the collapsed sidebar it switches to the round mark.
 */
export function RentinoBrand() {
  return (
    <Link
      href="/"
      className="flex items-center rounded-md p-1 outline-none group-data-[collapsible=icon]:p-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sidebar-ring focus-visible:outline-solid"
    >
      <RentinoLogo variant="sidebar" />
    </Link>
  )
}
