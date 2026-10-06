import "server-only"

import { mockSessionService } from "@/mocks/session"

import type { SessionService } from "./types"

export { can } from "./types"
export type { Permission, Session, SessionService, SessionUser } from "./types"

/** The session service the app uses (server only). Swap the mock for a real implementation here. */
export const sessionService: SessionService = mockSessionService
