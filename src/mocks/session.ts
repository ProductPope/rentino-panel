import { cookies } from "next/headers"

import type { SessionService, SessionUser } from "@/lib/session/types"

/**
 * Demo users. The `mock_user` cookie picks one (default: owner), so screens can be checked as a
 * user without "Manage discount codes".
 */
const USERS = {
  owner: {
    id: "user-1",
    name: "Anna Nowak",
    email: "anna@rentino.app",
    role: "Owner",
    branch: "Kraków",
    permissions: ["discount_codes.manage"],
  },
  staff: {
    id: "user-2",
    name: "Piotr Zieliński",
    email: "piotr@rentino.app",
    role: "Staff",
    branch: "Kraków",
    permissions: [],
  },
} satisfies Record<string, SessionUser>

export const mockSessionService: SessionService = {
  async getSession() {
    const key = (await cookies()).get("mock_user")?.value
    return { user: key === "staff" ? USERS.staff : USERS.owner }
  },
  async signOut() {
    // Nothing to end without a backend.
  },
}
