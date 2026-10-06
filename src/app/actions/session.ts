"use server"

import { sessionService } from "@/lib/session"

export async function signOut() {
  await sessionService.signOut()
}
