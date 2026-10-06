"use client"

import { ArrowRightIcon, CheckIcon, CircleCheckIcon, MailIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/sonner"
import { SETUP_SOURCES_HREF, WELCOME_HREF } from "@/config/navigation"
import {
  activeProcessingLabel,
  draftReadySummary,
  onboardingService,
  processingRows,
  type OnboardingStatus,
} from "@/lib/onboarding"
import { tenant } from "@/lib/tenant"
import { cn } from "@/lib/utils"

/** How often the page asks for progress while the draft is being prepared. */
const POLL_MS = 1000

const sentAt = (iso: string) =>
  new Intl.DateTimeFormat(tenant.locale, { hour: "numeric", minute: "2-digit" }).format(
    new Date(iso)
  )

/** Setup step 2: the draft is being prepared; the customer doesn't have to wait. */
export function ProgressStep() {
  const router = useRouter()
  const [status, setStatus] = useState<OnboardingStatus>()

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    async function poll() {
      try {
        const next = await onboardingService.getStatus()
        if (cancelled) return
        if (next.stage === "awaiting_input") return router.replace(SETUP_SOURCES_HREF)
        setStatus(next)
        if (next.stage === "processing") timer = setTimeout(() => void poll(), POLL_MS)
      } catch {
        if (!cancelled) toast.error("We couldn't check the progress. Reload to try again.")
      }
    }
    void poll()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [router])

  if (!status)
    return (
      <div aria-busy="true" className="flex flex-col gap-4">
        <span className="sr-only">Loading progress…</span>
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )

  if (status.stage !== "processing") return <DraftReady status={status} />

  const { processing, account } = status
  return (
    <>
      <div className="flex flex-col gap-4">
        <span className="flex size-12 items-center justify-center rounded-xl bg-primary-subtle">
          <Spinner aria-hidden="true" className="size-6 text-primary-text" />
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="text-page-title text-foreground">We&apos;re setting up your system</h1>
          <p className="text-body text-muted-foreground">
            {processing.long
              ? "Your price list is large, so this will take a few more hours."
              : `${processing.submittedAt ? `Sent today at ${sentAt(processing.submittedAt)}. ` : ""}It usually takes a few minutes, sometimes up to a few hours.`}
          </p>
        </div>
      </div>

      <Card>
        <ol aria-label="Progress" className="flex flex-col gap-3 px-(--card-spacing)">
          {processingRows(status).map((row) => (
            <li key={row.label} className="flex items-center gap-3">
              <span className="flex size-5 shrink-0 items-center justify-center">
                {row.state === "done" ? (
                  <span className="flex size-5 items-center justify-center rounded-full bg-success-subtle text-success-text">
                    <CheckIcon aria-hidden="true" className="size-3" />
                  </span>
                ) : row.state === "active" ? (
                  <Spinner aria-hidden="true" className="size-4 text-primary-text" />
                ) : (
                  <span className="size-4 rounded-full border border-dashed border-input" />
                )}
              </span>
              <span
                className={cn(
                  "text-body",
                  row.state === "pending" ? "text-muted-foreground" : "text-foreground"
                )}
              >
                <span className="sr-only">
                  {row.state === "done"
                    ? "Done: "
                    : row.state === "active"
                      ? "In progress: "
                      : "Next: "}
                </span>
                {row.label}
                {row.state === "active" && "…"}
              </span>
            </li>
          ))}
        </ol>
      </Card>
      <p aria-live="polite" className="sr-only">
        {activeProcessingLabel(status)}
      </p>

      <div className="flex gap-3 rounded-lg bg-muted px-4 py-3">
        <MailIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="flex flex-col gap-0.5">
          <p className="text-label text-foreground">
            You don&apos;t have to wait. We&apos;ll email you when the draft is ready.
          </p>
          <p className="text-body text-muted-foreground">
            {processing.long && processing.readyBy
              ? `You'll get it by ${processing.readyBy} today at the latest, at ${account.email}.`
              : `We'll send it to ${account.email}. The Welcome page updates too.`}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
        <p className="text-body text-muted-foreground">Meanwhile, try the system on demo data.</p>
        <Link href={WELCOME_HREF} className={buttonVariants()}>
          Go to the panel
          <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
        </Link>
      </div>
    </>
  )
}

/** Preparing finished while the customer watched (in the product, they'd also get the email). */
function DraftReady({ status }: { status: OnboardingStatus }) {
  return (
    <>
      <div className="flex flex-col gap-4">
        <span className="flex size-12 items-center justify-center rounded-xl bg-success-subtle text-success-text">
          <CircleCheckIcon aria-hidden="true" className="size-6" />
        </span>
        <div className="flex flex-col gap-2" role="status">
          <h1 className="text-page-title text-foreground">Your draft is ready</h1>
          <p className="text-body text-muted-foreground">{draftReadySummary(status.draft)}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-5">
        <Link href={WELCOME_HREF} className={buttonVariants()}>
          Go to the panel
          <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
        </Link>
      </div>
    </>
  )
}
