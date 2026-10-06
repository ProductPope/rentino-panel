import type { Metadata } from "next"

import { SetupShell } from "@/components/app/setup/setup-shell"
import { StartStep } from "@/components/app/setup/start-step"

export const metadata: Metadata = { title: "Setup — Start" }

export default function SetupStartPage() {
  return (
    <SetupShell step={5} wide>
      <StartStep />
    </SetupShell>
  )
}
