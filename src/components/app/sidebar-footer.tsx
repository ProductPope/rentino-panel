import { ExternalLinkIcon, GlobeIcon } from "lucide-react"
import Link from "next/link"

import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { BOOKING_PAGE_HREF } from "@/config/navigation"
import type { SessionUser } from "@/lib/session/types"

import { AccountMenu } from "./account-menu"

/** Sidebar footer: the public booking page, then the account menu (EQ RentinoSidebarFooter). */
export function SidebarFooterContent({ user }: { user: SessionUser }) {
  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip="View booking page"
            className="justify-center bg-sidebar-primary font-medium text-sidebar-primary-foreground hover:bg-primary-hover hover:text-primary-foreground active:bg-primary-hover active:text-primary-foreground"
            // The public page opens in a new tab, so the panel stays where it was.
            render={<Link href={BOOKING_PAGE_HREF} target="_blank" rel="noopener" />}
          >
            <GlobeIcon aria-hidden="true" />
            <span className="truncate">View booking page</span>
            <ExternalLinkIcon aria-hidden="true" className="group-data-[collapsible=icon]:hidden" />
            <span className="sr-only">(opens in a new tab)</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      <AccountMenu user={user} />
    </>
  )
}
