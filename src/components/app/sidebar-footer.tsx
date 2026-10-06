import { GlobeIcon } from "lucide-react"
import Link from "next/link"

import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import type { SessionUser } from "@/lib/session"

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
            render={<Link href="/booking-page" />}
          >
            <GlobeIcon aria-hidden="true" />
            <span className="truncate">View booking page</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      <AccountMenu user={user} />
    </>
  )
}
