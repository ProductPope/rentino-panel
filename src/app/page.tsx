import { redirect } from "next/navigation"

import { DISCOUNT_CODES_HREF } from "@/config/navigation"

/** Discount codes is the first live section; the dashboard is coming soon. */
export default function Home() {
  redirect(DISCOUNT_CODES_HREF)
}
