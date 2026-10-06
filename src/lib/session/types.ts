/**
 * Who is signed in. The panel has no backend yet: the session comes from a mock
 * (`src/mocks/session.ts`). UI code depends on these types only.
 */
export interface SessionUser {
  id: string
  name: string
  email: string
  /** Role name as shown to the user, e.g. "Owner". */
  role: string
  /** Branch the user works in, e.g. "Kraków". */
  branch: string
}

export interface Session {
  user: SessionUser
}

export interface SessionService {
  getSession(): Promise<Session>
  signOut(): Promise<void>
}
