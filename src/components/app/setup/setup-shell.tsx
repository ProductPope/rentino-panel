"use client"

import { XIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import type * as React from "react"

import { IconButton } from "@/components/eq/icon-button"
import { WELCOME_HREF } from "@/config/navigation"
import { SETUP_STEPS } from "@/lib/onboarding"
import { cn } from "@/lib/utils"

import { RentinoBrand } from "../rentino-brand"

/**
 * Full-screen setup wizard frame: logo · "Step N of 5" · close. Covers the admin shell, as in the
 * handoff. EQ-librium has no stepper yet, so the step is text (reported as a gap to EQ-librium).
 */
export function SetupShell({
  step,
  wide = false,
  children,
}: {
  step: number
  /** Lists (equipment and prices) get more room than single-column forms. */
  wide?: boolean
  children: React.ReactNode
}) {
  const router = useRouter()
  const name = SETUP_STEPS[step - 1]
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex min-h-16 flex-wrap items-center gap-x-4 gap-y-2 border-b border-border bg-card px-(--eq-page-padding) py-3">
        <div className="sm:w-48">
          <RentinoBrand />
        </div>
        <p className="flex-1 text-label text-foreground sm:text-center">
          Step {step} of {SETUP_STEPS.length} · {name}
        </p>
        <div className="flex items-center justify-end gap-3 sm:w-48">
          <span className="hidden text-caption text-muted-foreground lg:inline">
            You can come back from Welcome
          </span>
          <IconButton
            label="Close setup"
            icon={<XIcon aria-hidden="true" />}
            tooltipSide="bottom"
            onClick={() => router.push(WELCOME_HREF)}
          />
        </div>
      </header>
      <main
        className={cn(
          "mx-auto flex w-full flex-1 flex-col gap-6 px-(--eq-page-padding) py-10 sm:py-14",
          wide ? "max-w-5xl" : "max-w-2xl"
        )}
      >
        {children}
      </main>
    </div>
  )
}
