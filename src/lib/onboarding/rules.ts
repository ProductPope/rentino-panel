import type { DraftSummary, OnboardingAccount, OnboardingStatus } from "./types"

/** The setup wizard's steps, in order. The wizard shows "Step N of 5 · <name>". */
export const SETUP_STEPS = [
  "Your details",
  "Preparing",
  "Equipment and prices",
  "Settings",
  "Start",
] as const

/** How the customer adds equipment in step 1: by hand, or from a price list file we prepare. */
export type SourceKind = "manual" | "file"

/** Step 1 validation: a price list needs a file. Returns the error to show at the field. */
export function sourcesError(kind: SourceKind, fileName: string | undefined) {
  if (kind === "manual") return undefined
  return fileName ? undefined : "Add your price list file."
}

/** File size for people: "240 KB", "1.2 MB". */
export function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export type ProcessingRowState = "done" | "active" | "pending"

/** The processing list of step 2: steps before the active one are done, after it pending. */
export function processingRows(status: Pick<OnboardingStatus, "account" | "processing">) {
  const steps = processingSteps(status.account)
  const active = Math.min(Math.max(status.processing.activeStep, 0), steps.length - 1)
  return steps.map((label, i) => ({
    label,
    state: (i < active ? "done" : i === active ? "active" : "pending") as ProcessingRowState,
  }))
}

/** What a Welcome step's button does. The page maps each action to a route or a message. */
export type WelcomeAction =
  | "send_sources"
  | "show_progress"
  | "review_draft"
  | "finish_settings"
  | "test_booking"
  | "booking_page"
  | "locations"
  | "payments"
  | "email_templates"
  | "publish"

export interface WelcomeStep {
  id: WelcomeAction
  title: string
  description: string
  cta: string
  /** The next thing to do: emphasised card, primary button. At most one per list. */
  highlighted?: boolean
  /** Work in progress on our side (shows a spinner instead of the number). */
  busy?: boolean
  /** The step runs on demo data. */
  demo?: boolean
}

/** Processing steps as shown while the draft is being prepared. */
export function processingSteps(account: OnboardingAccount) {
  return [
    `Read ${account.priceListFile ?? "your price list"}`,
    "Found 3 bike categories and 2 add-ons",
    "26 bikes and their prices",
    "Checking seasonal price lists",
    "Looking for payment, delivery and terms",
    "Preparing a draft for you to review",
  ]
}

/** Label of the processing step in progress; clamped to the list. */
export function activeProcessingLabel(status: Pick<OnboardingStatus, "account" | "processing">) {
  const steps = processingSteps(status.account)
  const index = Math.min(Math.max(status.processing.activeStep, 0), steps.length - 1)
  return steps[index] ?? ""
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** "3 categories · 26 units · 1 item needs your decision" */
export function draftReadySummary(draft: DraftSummary) {
  const parts = [
    plural(draft.categories, "category", "categories"),
    plural(draft.units, "unit", "units"),
  ]
  if (draft.openDecisions > 0)
    parts.push(
      `${plural(draft.openDecisions, "item", "items")} ${draft.openDecisions === 1 ? "needs" : "need"} your decision`
    )
  else parts.push("nothing left to decide")
  return parts.join(" · ")
}

/** Intro under "Welcome to Rentino" for states A–C. */
export function welcomeIntro(stage: OnboardingStatus["stage"]) {
  switch (stage) {
    case "awaiting_input":
      return "Get started in a few steps. Add your equipment by hand, or send us your price list and we'll set it up for you. Meanwhile, try the system on demo data."
    case "processing":
      return "We're setting up your equipment, prices and rental terms. Meanwhile, see how the system works on demo data."
    case "draft_ready":
    case "imported":
      return "Your draft is ready. Review and approve it, and it will replace the demo data in the panel and on your booking page."
  }
}

const DEMO_STEPS: WelcomeStep[] = [
  {
    id: "test_booking",
    title: "Make a test booking",
    description: "See how a booking lands in the calendar.",
    cta: "Make a booking",
    demo: true,
  },
  {
    id: "booking_page",
    title: "View your booking page",
    description: "This is how your customers will see it.",
    cta: "Open page",
    demo: true,
  },
]

function firstStep(status: OnboardingStatus): WelcomeStep {
  switch (status.stage) {
    case "awaiting_input":
      return {
        id: "send_sources",
        title: "Add your equipment",
        description:
          "Enter it by hand, or send us your price list — we'll prepare a draft for you to review.",
        cta: "Add equipment",
        highlighted: true,
      }
    case "processing":
      return {
        id: "show_progress",
        title: "We're setting up your system",
        description: status.processing.long
          ? `Your draft will be ready ${status.processing.readyBy ? `by ${status.processing.readyBy} today at the latest` : "later today"}. We'll email you.`
          : `${activeProcessingLabel(status)}… We'll email you when the draft is ready.`,
        cta: "Show progress",
        busy: true,
      }
    default:
      return {
        id: "review_draft",
        title: "Your system is ready to review",
        description: draftReadySummary(status.draft),
        cta: "Review and approve",
        highlighted: true,
      }
  }
}

/** Steps on the Welcome page before import (states A–C). */
export function welcomeSteps(status: OnboardingStatus): WelcomeStep[] {
  return [firstStep(status), ...DEMO_STEPS]
}

/** "Next steps" checklist after import (state D). */
export function nextSteps(status: OnboardingStatus): WelcomeStep[] {
  const steps: WelcomeStep[] = []
  if (!status.settingsDone)
    steps.push({
      id: "finish_settings",
      title: "Finish your rental settings",
      description: "Confirm the VAT rate. We filled in payments, delivery and terms for you.",
      cta: "Finish",
      highlighted: true,
    })
  steps.push({
    id: "locations",
    title: "Set locations and opening hours",
    description: "Where and when customers pick up equipment.",
    cta: "Set up",
  })
  if (!status.paymentsConnected)
    steps.push({
      id: "payments",
      title: "Connect a payment account",
      description: "Customer deposits go straight to your account.",
      cta: "Connect",
    })
  steps.push(
    {
      id: "email_templates",
      title: "Customize email templates",
      description: "Confirmations and reminders for your customers.",
      cta: "Customize",
    },
    {
      id: "publish",
      title: "Publish your booking page",
      description:
        "Terms and customer signature are already set. All that's left is to turn on bookings.",
      cta: "Publish",
    }
  )
  return steps
}

/** Title of the success card after import. */
export function importedTitle(status: Pick<OnboardingStatus, "settingsDone">) {
  return status.settingsDone
    ? "Your equipment, price lists and rental terms are in the system"
    : "Your equipment and price lists are in the system"
}

/** One-line summary on the success card after import. */
export function importedSummary(status: OnboardingStatus) {
  const { draft, settings } = status
  const parts = [
    plural(draft.categories, "category", "categories"),
    plural(draft.units, "unit", "units"),
  ]
  if (status.settingsDone) {
    parts.push(
      settings.payMode === "deposit"
        ? `${settings.depositPercent}% deposit`
        : "full payment online",
      settings.delivery ? "delivery" : "pickup only"
    )
  } else if (draft.addons > 0) {
    parts.push(plural(draft.addons, "add-on", "add-ons"))
  }
  parts.push("demo data removed")
  return parts.join(" · ")
}
