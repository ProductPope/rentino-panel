import { redirect } from "next/navigation"

import { WELCOME_HREF } from "@/config/navigation"

/** Welcome (onboarding) is the first page of the panel; the dashboard is coming soon. */
export default function Home() {
  redirect(WELCOME_HREF)
}
