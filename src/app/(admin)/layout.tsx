import { cookies } from "next/headers"

import { AdminShell } from "@/components/app/admin-shell"
import { sessionService } from "@/lib/session"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [cookieStore, session] = await Promise.all([cookies(), sessionService.getSession()])
  // Written by the sidebar when it is collapsed or expanded; keeps the choice across reloads.
  const defaultCollapsed = cookieStore.get("sidebar_state")?.value === "false"

  return (
    <AdminShell user={session.user} defaultCollapsed={defaultCollapsed}>
      {children}
    </AdminShell>
  )
}
