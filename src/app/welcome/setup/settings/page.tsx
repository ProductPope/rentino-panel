import type { Metadata } from "next"

import { SettingsStep } from "@/components/app/setup/settings-step"
import { SetupShell } from "@/components/app/setup/setup-shell"

export const metadata: Metadata = { title: "Setup — Settings" }

export default function SetupSettingsPage() {
  return (
    <SetupShell step={4}>
      <SettingsStep />
    </SetupShell>
  )
}
