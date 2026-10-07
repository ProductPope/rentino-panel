"use client"

import {
  CreditCardIcon,
  ExternalLinkIcon,
  ImageIcon,
  LockIcon,
  SearchIcon,
  TriangleAlertIcon,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/sonner"
import {
  BOOKING_PAGE_HREF,
  SETUP_EQUIPMENT_HREF,
  SETUP_SETTINGS_HREF,
  WELCOME_HREF,
} from "@/config/navigation"
import {
  bookingDomain,
  bookingPreviewItems,
  initials,
  onboardingService,
  setupRows,
  type EquipmentItem,
  type OnboardingStatus,
  type SetupArea,
} from "@/lib/onboarding"

import { EquipmentFirst } from "./equipment-first"

type Load =
  | { state: "loading" }
  | { state: "error" }
  | { state: "ready"; status: OnboardingStatus; items: EquipmentItem[] }

const EDIT_HREF: Record<SetupArea, string> = {
  equipment: SETUP_EQUIPMENT_HREF,
  settings: SETUP_SETTINGS_HREF,
}

/**
 * Setup step 5: the booking page is ready. A preview with the customer's equipment and prices,
 * what we set up (each with a way back to change it), and the last step: connect payments.
 */
export function StartStep() {
  const [load, setLoad] = useState<Load>({ state: "loading" })

  useEffect(() => {
    Promise.all([onboardingService.getStatus(), onboardingService.listEquipment()])
      .then(([status, items]) => setLoad({ state: "ready", status, items }))
      .catch(() => setLoad({ state: "error" }))
  }, [])

  const intro = (
    <div className="flex flex-col gap-2">
      <h1 className="text-page-title text-foreground">Your booking page is ready</h1>
      <p className="text-body text-muted-foreground">
        This is how your customers will see it: your equipment, your prices, your terms.
      </p>
    </div>
  )

  if (load.state === "loading")
    return (
      <>
        {intro}
        <div aria-busy="true" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <span className="sr-only">Loading your booking page…</span>
          <Skeleton className="h-96 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </>
    )

  if (load.state === "error")
    return (
      <>
        {intro}
        <Alert variant="destructive" announce="assertive">
          <TriangleAlertIcon aria-hidden="true" />
          <AlertTitle>Your booking page couldn&apos;t be loaded</AlertTitle>
          <AlertDescription>Reload the page to try again.</AlertDescription>
        </Alert>
      </>
    )

  if (load.status.stage !== "imported")
    return (
      <>
        {intro}
        <EquipmentFirst what="Your booking page and payments" />
      </>
    )

  const { status, items } = load
  return (
    <>
      {intro}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <BookingPreview status={status} items={items} />
        <div className="flex flex-col gap-4">
          <SetupSummary status={status} items={items} />
          <LastStep status={status} />
        </div>
      </div>
    </>
  )
}

/** The booking page as customers see it — a picture of it, not a working form. */
function BookingPreview({ status, items }: { status: OnboardingStatus; items: EquipmentItem[] }) {
  const domain = bookingDomain(status.account.name)
  const preview = bookingPreviewItems(items)
  return (
    <Card role="region" aria-label="Preview of your booking page" className="gap-0 py-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border px-4 py-3">
        <span className="text-caption font-medium tracking-wide text-muted-foreground uppercase">
          Preview
        </span>
        <span className="flex-1 sm:hidden" />
        <span className="order-last flex min-w-0 basis-full sm:order-none sm:flex-1 sm:basis-auto sm:justify-center">
          <span className="flex min-w-0 items-center gap-1.5 rounded-full bg-muted px-3 py-1 font-mono text-caption text-foreground">
            <LockIcon aria-hidden="true" className="size-3 shrink-0" />
            <span className="truncate">{domain}</span>
          </span>
        </span>
        <Link
          href={BOOKING_PAGE_HREF}
          target="_blank"
          rel="noopener"
          className={buttonVariants({ variant: "link", size: "sm" })}
        >
          Open page
          <ExternalLinkIcon data-icon="inline-end" aria-hidden="true" />
          <span className="sr-only">(opens in a new tab)</span>
        </Link>
      </div>

      <div className="flex flex-col gap-5 bg-muted p-5">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-9 items-center justify-center rounded-full bg-primary text-label text-primary-foreground"
          >
            {initials(status.account.name)}
          </span>
          <span className="text-label text-foreground">{status.account.name}</span>
        </div>

        {/* The search bar is a picture: nothing in a preview can be used. */}
        <div aria-hidden="true" className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
          {[
            ["Pickup", "Sat, Apr 12"],
            ["Return", "Mon, Apr 14"],
            ["Pickup location", status.account.city],
          ].map(([label, value]) => (
            <span key={label} className="flex flex-col gap-1">
              <span className="text-caption text-muted-foreground">{label}</span>
              <span className="truncate rounded-md border border-input bg-card px-3 py-2 text-body text-foreground">
                {value}
              </span>
            </span>
          ))}
          <span className="flex items-center justify-center gap-1.5 self-end rounded-md bg-foreground px-4 py-2 text-label text-background">
            <SearchIcon className="size-4" />
            Search
          </span>
        </div>

        {preview.length > 0 ? (
          <ul aria-label="Equipment on your booking page" className="grid gap-3 sm:grid-cols-3">
            {preview.map((item) => (
              <li key={item.id} className="overflow-hidden rounded-lg border border-border bg-card">
                {item.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- a data URL or a local demo photo
                  <img src={item.photoUrl} alt="" className="h-28 w-full bg-white object-contain" />
                ) : (
                  <span className="flex h-28 flex-col items-center justify-center gap-1 border-b border-dashed border-input text-caption text-muted-foreground">
                    <ImageIcon aria-hidden="true" className="size-5" />
                    No photo yet
                  </span>
                )}
                <span className="flex flex-col gap-0.5 p-3">
                  <span className="text-label text-foreground">{item.name}</span>
                  <span className="text-body text-muted-foreground">{item.price}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-body text-muted-foreground">
            Your equipment from the price list shows here.
          </p>
        )}
      </div>
    </Card>
  )
}

function SetupSummary({ status, items }: { status: OnboardingStatus; items: EquipmentItem[] }) {
  return (
    <Card role="region" aria-labelledby="setup-summary-title" size="sm">
      <CardContent className="gap-0">
        <h2 id="setup-summary-title" className="pb-2 text-section-title text-foreground">
          What we set up for you
        </h2>
        <ul className="flex flex-col">
          {setupRows(status, items).map((row) => (
            <li
              key={row.label}
              className="flex items-center justify-between gap-3 border-t border-border py-2.5 text-body text-foreground"
            >
              <span>{row.label}</span>
              <Link
                href={EDIT_HREF[row.area]}
                aria-label={`Edit: ${row.label}`}
                className={buttonVariants({ variant: "link", size: "sm", className: "shrink-0" })}
              >
                Edit
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function LastStep({ status }: { status: OnboardingStatus }) {
  const router = useRouter()
  const [connecting, setConnecting] = useState(false)
  const domain = bookingDomain(status.account.name)

  async function connect() {
    setConnecting(true)
    try {
      await onboardingService.connectPayments()
      toast.success("Payments connected", {
        description: "Deposits from customers now go to your account.",
      })
      router.push(WELCOME_HREF)
    } catch {
      setConnecting(false)
      toast.error("We couldn't connect your account. Try again.")
    }
  }

  async function shareLater() {
    try {
      await navigator.clipboard.writeText(`https://${domain}`)
      toast("Preview link copied", { description: domain })
    } catch {
      toast("Your preview link", { description: `https://${domain}` })
    }
    router.push(WELCOME_HREF)
  }

  if (status.paymentsConnected)
    return (
      <Card role="region" aria-labelledby="last-step-title" size="sm">
        <CardContent className="gap-2">
          <h2 id="last-step-title" className="text-section-title text-foreground">
            Payments are connected
          </h2>
          <p className="text-body text-muted-foreground">
            Customer deposits go straight to your account.
          </p>
          <Link href={WELCOME_HREF} className={buttonVariants({ className: "mt-2 w-full" })}>
            Go to the panel
          </Link>
        </CardContent>
      </Card>
    )

  return (
    <Card role="region" aria-labelledby="last-step-title" size="sm" className="ring-2 ring-primary">
      <CardContent className="gap-2">
        <p className="text-caption font-semibold tracking-wide text-primary-text uppercase">
          Last step
        </p>
        <h2 id="last-step-title" className="text-section-title text-foreground">
          Connect payments
        </h2>
        <p className="text-body text-muted-foreground">
          You&apos;ll sign in to Stripe and connect your account. It takes about two minutes. We
          never see your password or keys.
        </p>
        <Button className="mt-2 w-full" loading={connecting} onClick={() => void connect()}>
          <CreditCardIcon data-icon="inline-start" aria-hidden="true" />
          Connect with Stripe
        </Button>
        <Button variant="link" className="self-center" onClick={() => void shareLater()}>
          Not yet — share a preview link
        </Button>
      </CardContent>
    </Card>
  )
}
