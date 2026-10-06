import type { Metadata } from "next"

import { EquipmentStep } from "@/components/app/setup/equipment-step"
import { SetupShell } from "@/components/app/setup/setup-shell"

export const metadata: Metadata = { title: "Setup — Equipment and prices" }

export default function SetupEquipmentPage() {
  return (
    <SetupShell step={3} wide>
      <EquipmentStep />
    </SetupShell>
  )
}
