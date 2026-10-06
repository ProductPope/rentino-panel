"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type * as React from "react"

import { AppShell } from "@/components/eq/app-shell"
import { navigationFor } from "@/config/navigation"
import type { SessionUser } from "@/lib/session/types"

import { RentinoBrand } from "./rentino-brand"
import { SidebarFooterContent } from "./sidebar-footer"

export function AdminShell({
  user,
  defaultCollapsed,
  children,
}: {
  user: SessionUser
  defaultCollapsed: boolean
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <AppShell
      brand={<RentinoBrand />}
      navigation={navigationFor(user)}
      currentHref={pathname}
      defaultCollapsed={defaultCollapsed}
      renderLink={(item) => <Link href={item.href} />}
      sidebarFooter={<SidebarFooterContent user={user} />}
    >
      {children}
    </AppShell>
  )
}
