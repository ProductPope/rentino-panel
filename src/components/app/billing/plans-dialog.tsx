"use client"

import { useState } from "react"

import { ViewSwitch } from "@/components/eq/view-switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/sonner"
import {
  ANNUAL_DISCOUNT,
  annualTotal,
  billingService,
  monthlyPrice,
  PLANS,
  type BillingPeriod,
  type Plan,
  type Subscription,
} from "@/lib/billing"
import { formatMoney } from "@/lib/tenant"
import { cn } from "@/lib/utils"

const PERIODS = [
  { value: "monthly", label: "Monthly" },
  { value: "annual", label: `Annually −${ANNUAL_DISCOUNT}%` },
] as const

const whole = (amount: number) => formatMoney(amount).replace(/\.00$/, "")
const limit = (n: number | "unlimited") => (n === "unlimited" ? "Unlimited" : String(n))

/** "Choose a plan": four plans, monthly or annual billing (annual −20%). */
export function PlansDialog({
  open,
  onOpenChange,
  onChosen,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onChosen: (subscription: Subscription) => void
}) {
  const [period, setPeriod] = useState<BillingPeriod>("annual")
  const [choosing, setChoosing] = useState<string | null>(null)

  async function choose(plan: Plan) {
    if (plan.monthly == null) {
      toast("Thanks — we'll be in touch", {
        description: "Our team will contact you within one business day about Unlimited.",
      })
      onOpenChange(false)
      return
    }
    setChoosing(plan.id)
    try {
      const subscription = await billingService.choosePlan(plan.id, period)
      toast.success(`You're on ${plan.name}`, {
        description: period === "annual" ? "Billed annually." : "Billed monthly.",
      })
      onChosen(subscription)
      onOpenChange(false)
    } catch {
      toast.error("We couldn't change your plan. Try again.")
    } finally {
      setChoosing(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="text-page-title">Choose a plan</DialogTitle>
          <DialogDescription>
            Every plan comes with a 14-day money-back guarantee.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center">
          <ViewSwitch
            aria-label="Billing period"
            options={PERIODS}
            value={period}
            onValueChange={setPeriod}
          />
        </div>

        <ul aria-label="Plans" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => {
            const price = monthlyPrice(plan, period)
            const yearly = annualTotal(plan)
            return (
              <li key={plan.id} className="flex">
                <Card
                  className={cn("w-full", plan.popular && "ring-2 ring-primary")}
                  aria-labelledby={`plan-${plan.id}`}
                  role="group"
                >
                  <CardContent className="flex h-full flex-col gap-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3
                        id={`plan-${plan.id}`}
                        className={cn(
                          "text-caption font-semibold tracking-wide uppercase",
                          plan.popular ? "text-primary-text" : "text-muted-foreground"
                        )}
                      >
                        {plan.name}
                      </h3>
                      {plan.popular && <Badge>Most popular</Badge>}
                    </div>

                    {price == null ? (
                      <div className="flex flex-col gap-1">
                        <p className="text-page-title text-foreground">Ask for a price</p>
                        <p className="text-body text-muted-foreground">
                          Priced for the size of your team.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <p className="text-foreground">
                          <span className="text-page-title">{whole(price)}</span>{" "}
                          <span className="text-body text-muted-foreground">/ month</span>
                        </p>
                        <p className="flex flex-wrap items-center gap-2 text-body text-muted-foreground">
                          {period === "annual" ? (
                            <>
                              <Badge variant="success">−{ANNUAL_DISCOUNT}%</Badge>
                              {yearly != null && `${whole(yearly)} billed yearly`}
                            </>
                          ) : (
                            "Billed monthly"
                          )}
                        </p>
                      </div>
                    )}

                    <dl className="flex flex-col gap-2 border-t border-border pt-4 text-body">
                      <div className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">Branches</dt>
                        <dd className="font-medium text-foreground">{limit(plan.branches)}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">Logins</dt>
                        <dd className="font-medium text-foreground">{limit(plan.logins)}</dd>
                      </div>
                    </dl>

                    <Button
                      className="mt-auto w-full"
                      variant={plan.popular ? "default" : "outline"}
                      loading={choosing === plan.id}
                      disabled={choosing !== null}
                      aria-describedby={`plan-${plan.id}`}
                      onClick={() => void choose(plan)}
                    >
                      {plan.monthly == null ? "Contact us" : `Choose ${plan.name}`}
                    </Button>
                  </CardContent>
                </Card>
              </li>
            )
          })}
        </ul>

        <DialogFooter className="sm:justify-center">
          <p className="text-body text-muted-foreground">
            Billed monthly or annually. Cancel anytime.
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
