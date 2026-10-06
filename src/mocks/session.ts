import type { SessionService } from "@/lib/session/types"

/** Demo session: always signed in as the tenant owner. */
export const mockSessionService: SessionService = {
  async getSession() {
    return {
      user: {
        id: "user-1",
        name: "Anna Nowak",
        email: "anna@rentino.app",
        role: "Owner",
        branch: "Kraków",
      },
    }
  },
  async signOut() {
    // Nothing to end without a backend.
  },
}
