import { mockSessionService } from "@/mocks/session"

import type { SessionService } from "./types"

export type { Session, SessionService, SessionUser } from "./types"

/** The session service the app uses. Swap the mock for a real implementation here. */
export const sessionService: SessionService = mockSessionService
