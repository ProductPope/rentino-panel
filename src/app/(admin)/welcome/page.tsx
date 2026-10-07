import type { Metadata } from "next"

import { TrialBar } from "@/components/app/billing/trial-bar"
import { WelcomeView } from "@/components/app/welcome/welcome-view"

export const metadata: Metadata = { title: "Welcome" }

export default function WelcomePage() {
  return (
    <div className="flex flex-col gap-(--eq-page-header-gap)">
      <TrialBar />
      <WelcomeView />
    </div>
  )
}
