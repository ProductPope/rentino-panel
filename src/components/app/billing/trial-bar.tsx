"use client"

import { CrownIcon } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { billingService, showsTrial, trialStatus, type Subscription } from "@/lib/billing"
import { tenant } from "@/lib/tenant"
import { cn } from "@/lib/utils"

import { PlansDialog } from "./plans-dialog"

const longDate = (date: Date) =>
  new Intl.DateTimeFormat(tenant.locale, { month: "long", day: "numeric", year: "numeric" }).format(
    date
  )

/**
 * Trial days left, with "Upgrade to Premium" opening the plans. Hidden once a plan is chosen.
 * EQ-librium has no progress bar yet, so the days are a counter (reported as a gap).
 */
export function TrialBar() {
  const [subscription, setSubscription] = useState<Subscription>()
  const [plansOpen, setPlansOpen] = useState(false)

  useEffect(() => {
    billingService
      .getSubscription()
      .then(setSubscription)
      .catch(() => undefined) // The bar is optional: without it, Welcome still works.
  }, [])

  if (!subscription || !showsTrial(subscription)) return null
  const trial = trialStatus(subscription)

  return (
    <Card
      role="region"
      aria-label="Free trial"
      size="sm"
      className={cn(trial.ended && "ring-2 ring-warning")}
    >
      <CardContent className="flex-row flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex min-w-0 flex-[1_1_15rem] flex-col gap-1">
          <p className="text-caption font-semibold tracking-wide text-muted-foreground uppercase">
            Trial days left —{" "}
            <span className="font-mono">
              {trial.daysLeft} / {trial.daysTotal}
            </span>
          </p>
          <p className="text-body text-foreground">
            {trial.ended ? (
              <>Your free trial has ended. Choose a plan to keep using every feature.</>
            ) : (
              <>
                Your trial ends on{" "}
                <strong className="font-semibold">{longDate(trial.endsAt)}</strong>. Upgrade to a
                paid plan to keep access to every feature.
              </>
            )}
          </p>
        </div>
        <Button variant="outline" onClick={() => setPlansOpen(true)}>
          <CrownIcon data-icon="inline-start" aria-hidden="true" />
          Upgrade to Premium
        </Button>
      </CardContent>
      <PlansDialog open={plansOpen} onOpenChange={setPlansOpen} onChosen={setSubscription} />
    </Card>
  )
}
