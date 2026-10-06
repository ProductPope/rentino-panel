import type { Metadata } from "next"

import { SetupShell } from "@/components/app/setup/setup-shell"
import { SourcesStep } from "@/components/app/setup/sources-step"

export const metadata: Metadata = { title: "Setup — Your details" }

export default function SetupSourcesPage() {
  return (
    <SetupShell step={1}>
      <SourcesStep />
    </SetupShell>
  )
}
