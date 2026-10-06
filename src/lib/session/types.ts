/**
 * Who is signed in. The panel has no backend yet: the session comes from a mock
 * (`src/mocks/session.ts`). UI code depends on these types only.
 */

/** Permissions from Settings → Roles. */
export type Permission = "discount_codes.manage"

export interface SessionUser {
  id: string
  name: string
  email: string
  /** Role name as shown to the user, e.g. "Owner". */
  role: string
  /** Branch the user works in, e.g. "Kraków". */
  branch: string
  permissions: Permission[]
}

export interface Session {
  user: SessionUser
}

/** Server-side only. */
export interface SessionService {
  getSession(): Promise<Session>
  signOut(): Promise<void>
}

export const can = (user: Pick<SessionUser, "permissions">, permission: Permission) =>
  user.permissions.includes(permission)
