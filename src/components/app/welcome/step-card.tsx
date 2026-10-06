"use client"

import { ArrowRightIcon } from "lucide-react"
import Link from "next/link"
import { useId } from "react"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import type { WelcomeAction, WelcomeStep } from "@/lib/onboarding"
import { cn } from "@/lib/utils"

export interface StepCardProps {
  step: WelcomeStep
  number: number
  /** Heading level of the step title, so the page outline stays correct. */
  headingLevel: 2 | 3
  /** Route for a step that navigates; otherwise `onAction` runs. */
  href?: string
  onAction: (action: WelcomeAction) => void
}

/** One onboarding step: number (or spinner), title, description, a single call to action. */
export function StepCard({ step, number, headingLevel, href, onAction }: StepCardProps) {
  const titleId = useId()
  const Heading = headingLevel === 2 ? "h2" : "h3"
  const variant = step.highlighted ? "default" : "outline"
  const content = (
    <>
      {step.cta}
      <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
    </>
  )

  return (
    <li>
      <Card
        size="sm"
        data-highlighted={step.highlighted ? "" : undefined}
        className="data-highlighted:ring-2 data-highlighted:ring-primary"
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-(--card-spacing)">
          {step.busy ? (
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted">
              <Spinner aria-label="In progress" className="size-3.5 text-primary-text" />
            </span>
          ) : (
            <span
              aria-hidden="true"
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border font-mono text-caption",
                step.highlighted
                  ? "border-primary text-primary-text"
                  : "border-border text-muted-foreground"
              )}
            >
              {number}
            </span>
          )}
          <div className="flex min-w-48 flex-1 flex-col gap-0.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Heading id={titleId} className="text-label text-foreground">
                {step.title}
              </Heading>
              {step.demo && <Badge variant="info">Demo data</Badge>}
            </div>
            <p className="text-body text-muted-foreground">{step.description}</p>
          </div>
          {href ? (
            // A real link (it navigates), styled as a button.
            <Link href={href} aria-describedby={titleId} className={buttonVariants({ variant })}>
              {content}
            </Link>
          ) : (
            <Button variant={variant} aria-describedby={titleId} onClick={() => onAction(step.id)}>
              {content}
            </Button>
          )}
        </div>
      </Card>
    </li>
  )
}

/** "0/3" for the eye, "0 of 3 steps done" for screen readers. */
export function StepCounter({ done, total }: { done: number; total: number }) {
  return (
    <p className="font-mono text-caption text-muted-foreground">
      <span aria-hidden="true">
        {done}/{total}
      </span>
      <span className="sr-only">
        {done} of {total} steps done
      </span>
    </p>
  )
}
