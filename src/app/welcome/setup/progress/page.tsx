import type { Metadata } from "next"

import { ProgressStep } from "@/components/app/setup/progress-step"
import { SetupShell } from "@/components/app/setup/setup-shell"

export const metadata: Metadata = { title: "Setup — Preparing" }

export default function SetupProgressPage() {
  return (
    <SetupShell step={2}>
      <ProgressStep />
    </SetupShell>
  )
}
