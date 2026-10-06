"use client"

import { CircleCheckIcon, ExternalLinkIcon, RotateCcwIcon, TriangleAlertIcon } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"

import { PageHeader } from "@/components/eq/page-header"
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/sonner"
import { BOOKING_PAGE_HREF, SETUP_PROGRESS_HREF, SETUP_SOURCES_HREF } from "@/config/navigation"
import {
  importedSummary,
  importedTitle,
  nextSteps,
  onboardingService,
  welcomeIntro,
  welcomeSteps,
  type OnboardingStatus,
  type WelcomeAction,
} from "@/lib/onboarding"

import { StepCard, StepCounter } from "./step-card"

const TITLE = "Welcome to Rentino"

type Load =
  | { state: "loading" }
  | { state: "error"; message: string }
  | { state: "ready"; status: OnboardingStatus }

const errorMessage = (err: unknown) =>
  err instanceof Error && err.message ? err.message : "Something went wrong. Try again."

/** Wizard steps not built yet (stages 3–4). */
const WIZARD_ACTIONS: WelcomeAction[] = ["review_draft", "finish_settings"]

/** How often state B checks whether the draft is ready (the card updates by itself). */
const POLL_MS = 2000

function handleAction(action: WelcomeAction) {
  if (WIZARD_ACTIONS.includes(action))
    toast("The setup wizard is coming soon", {
      description: "It's the next part of the panel to ship.",
    })
  else toast("Coming soon", { description: "This isn't part of the panel yet." })
}

const HREFS: Partial<Record<WelcomeAction, string>> = {
  send_sources: SETUP_SOURCES_HREF,
  show_progress: SETUP_PROGRESS_HREF,
  booking_page: BOOKING_PAGE_HREF,
}
const hrefFor = (action: WelcomeAction) => HREFS[action]

/** Welcome: the onboarding checklist of a new rental business (states A–D). */
export function WelcomeView() {
  const [load, setLoad] = useState<Load>({ state: "loading" })

  const fetchStatus = useCallback(async () => {
    setLoad({ state: "loading" })
    try {
      setLoad({ state: "ready", status: await onboardingService.getStatus() })
    } catch (err) {
      setLoad({ state: "error", message: errorMessage(err) })
    }
  }, [])

  useEffect(() => {
    // Load once on mount; the service is async (mocked latency).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchStatus()
  }, [fetchStatus])

  const processing = load.state === "ready" && load.status.stage === "processing"
  useEffect(() => {
    if (!processing) return
    // While the draft is being prepared, refresh quietly: the step label moves on and the card
    // turns into "ready to review" by itself (in the product, the customer also gets an email).
    const timer = setInterval(() => {
      onboardingService
        .getStatus()
        .then((status) => setLoad({ state: "ready", status }))
        .catch(() => undefined)
    }, POLL_MS)
    return () => clearInterval(timer)
  }, [processing])

  if (load.state === "loading")
    return (
      <div aria-busy="true" className="flex flex-col gap-(--eq-page-header-gap)">
        <PageHeader title={TITLE} />
        <span className="sr-only">Loading your onboarding steps…</span>
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    )

  if (load.state === "error")
    return (
      <div className="flex flex-col gap-(--eq-page-header-gap)">
        <PageHeader title={TITLE} />
        <Alert variant="destructive" announce="assertive">
          <TriangleAlertIcon aria-hidden="true" />
          <AlertTitle>Your onboarding steps couldn&apos;t be loaded</AlertTitle>
          <AlertDescription>{load.message}</AlertDescription>
          <AlertAction>
            <Button size="sm" variant="outline" onClick={() => void fetchStatus()}>
              <RotateCcwIcon data-icon="inline-start" aria-hidden="true" />
              Try again
            </Button>
          </AlertAction>
        </Alert>
      </div>
    )

  const { status } = load
  return status.stage === "imported" ? (
    <WelcomeImported status={status} />
  ) : (
    <WelcomeGettingStarted status={status} />
  )
}

/** States A–C: intro card with progress, then the steps as cards. */
function WelcomeGettingStarted({ status }: { status: OnboardingStatus }) {
  const steps = welcomeSteps(status)
  return (
    <div className="flex max-w-(--eq-page-form-max-width) flex-col gap-4">
      <Card>
        <CardContent className="gap-4">
          <PageHeader title={TITLE} description={welcomeIntro(status.stage)} />
          <StepCounter done={0} total={steps.length} />
        </CardContent>
      </Card>
      <ol aria-label="Getting started" className="flex flex-col gap-3">
        {steps.map((step, i) => (
          <StepCard
            key={step.id}
            step={step}
            number={i + 1}
            headingLevel={2}
            href={hrefFor(step.id)}
            onAction={handleAction}
          />
        ))}
      </ol>
    </div>
  )
}

/** State D: the draft is imported; what's left before the first booking. */
function WelcomeImported({ status }: { status: OnboardingStatus }) {
  const steps = nextSteps(status)
  return (
    <div className="flex max-w-(--eq-page-form-max-width) flex-col gap-(--eq-page-header-gap)">
      <PageHeader title={TITLE} description={`${status.account.name} · ${status.account.city}`} />
      <Card>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-(--card-spacing)">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success-subtle text-success-text">
            <CircleCheckIcon aria-hidden="true" className="size-5" />
          </span>
          <div className="flex min-w-48 flex-1 flex-col gap-0.5">
            <h2 className="text-section-title text-foreground">{importedTitle(status)}</h2>
            <p className="text-body text-muted-foreground">{importedSummary(status)}</p>
          </div>
          <Link
            href={BOOKING_PAGE_HREF}
            target="_blank"
            rel="noopener"
            className={buttonVariants({ variant: "link" })}
          >
            View booking page with your data
            <ExternalLinkIcon data-icon="inline-end" aria-hidden="true" />
            <span className="sr-only">(opens in a new tab)</span>
          </Link>
        </div>
      </Card>
      <section aria-labelledby="next-steps-title" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
          <div className="flex flex-col gap-0.5">
            <h2 id="next-steps-title" className="text-section-title text-foreground">
              Next steps
            </h2>
            <p className="text-body text-muted-foreground">
              A few more things before you take your first booking.
            </p>
          </div>
          <StepCounter done={0} total={steps.length} />
        </div>
        <ol aria-labelledby="next-steps-title" className="flex flex-col gap-3">
          {steps.map((step, i) => (
            <StepCard
              key={step.id}
              step={step}
              number={i + 1}
              headingLevel={3}
              href={hrefFor(step.id)}
              onAction={handleAction}
            />
          ))}
        </ol>
      </section>
    </div>
  )
}
