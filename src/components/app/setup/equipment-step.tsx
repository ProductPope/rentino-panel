"use client"

import {
  CheckIcon,
  ChevronDownIcon,
  PackageIcon,
  PencilIcon,
  PlusIcon,
  RotateCcwIcon,
  Trash2Icon,
  TriangleAlertIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"

import { ConfirmDialog } from "@/components/eq/confirm-dialog"
import { EmptyState } from "@/components/eq/empty-state"
import { PageHeader } from "@/components/eq/page-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/sonner"
import { SETUP_SETTINGS_HREF } from "@/config/navigation"
import {
  assignCodes,
  codeRange,
  equipmentTotals,
  onboardingService,
  pricingSummary,
  type EquipmentItem,
} from "@/lib/onboarding"

import { EquipmentPanel, EquipmentThumbnail } from "./equipment-panel"
import { PricingBreakdown } from "./pricing-breakdown"

type Load = { state: "loading" } | { state: "error" } | { state: "ready"; items: EquipmentItem[] }

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/**
 * Setup step 3 when the customer adds equipment by hand: the list looks like the draft review
 * (one panel per item with its price list); items are added and edited in the side EditPanel.
 */
export function EquipmentStep() {
  const router = useRouter()
  const [load, setLoad] = useState<Load>({ state: "loading" })
  // `session` re-mounts the panel on every opening, so it starts from the item it opens with.
  const [panel, setPanel] = useState<{ open: boolean; item?: EquipmentItem; session: number }>({
    open: false,
    session: 0,
  })
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [nothingToApprove, setNothingToApprove] = useState(false)

  const fetchItems = useCallback(async () => {
    setLoad({ state: "loading" })
    try {
      setLoad({ state: "ready", items: await onboardingService.listEquipment() })
    } catch {
      setLoad({ state: "error" })
    }
  }, [])

  useEffect(() => {
    // Load once on mount; the service is async (mocked latency).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchItems()
  }, [fetchItems])

  const items = useMemo(() => (load.state === "ready" ? load.items : []), [load])
  const codes = useMemo(() => assignCodes(items), [items])
  const totals = equipmentTotals(items)

  const replace = useCallback((item: EquipmentItem) => {
    setLoad((l) => {
      if (l.state !== "ready") return l
      const exists = l.items.some((i) => i.id === item.id)
      return {
        ...l,
        items: exists ? l.items.map((i) => (i.id === item.id ? item : i)) : [...l.items, item],
      }
    })
    setNothingToApprove(false)
  }, [])

  const openPanel = (item?: EquipmentItem) =>
    setPanel((p) => ({ open: true, item, session: p.session + 1 }))

  async function remove(item: EquipmentItem) {
    try {
      await onboardingService.removeEquipment(item.id)
      setLoad((l) =>
        l.state === "ready" ? { ...l, items: l.items.filter((i) => i.id !== item.id) } : l
      )
      toast(`Removed ${item.name}`, {
        action: {
          label: "Undo",
          onClick: () => void onboardingService.putEquipment(item).then(replace),
        },
      })
    } catch {
      toast.error("We couldn't remove it. Try again.")
    }
  }

  function approve() {
    if (totals.items === 0) {
      setNothingToApprove(true)
      return
    }
    setConfirmOpen(true)
  }

  return (
    <>
      <PageHeader
        title="Your equipment"
        description="Add what you rent out and set its prices: rates per hour, day, week or month, packages, and price rules for seasons or weekends."
        actions={
          <Button variant="outline" onClick={() => openPanel()}>
            <PlusIcon data-icon="inline-start" aria-hidden="true" />
            Add equipment
          </Button>
        }
        primaryAction={
          <Button onClick={approve} disabled={load.state !== "ready"}>
            <CheckIcon data-icon="inline-start" aria-hidden="true" />
            Approve
          </Button>
        }
      />

      {nothingToApprove && (
        <Alert variant="warning" announce="assertive">
          <TriangleAlertIcon aria-hidden="true" />
          <AlertTitle>Add at least one item of your own</AlertTitle>
          <AlertDescription>
            Demo examples aren&apos;t saved when you approve. Add equipment, or edit an example to
            make it yours.
          </AlertDescription>
        </Alert>
      )}

      {load.state === "loading" && (
        <div aria-busy="true" className="flex flex-col gap-4">
          <span className="sr-only">Loading your equipment…</span>
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      )}

      {load.state === "error" && (
        <Alert variant="destructive" announce="assertive">
          <TriangleAlertIcon aria-hidden="true" />
          <AlertTitle>Your equipment couldn&apos;t be loaded</AlertTitle>
          <AlertDescription>
            <div>
              <Button size="sm" variant="outline" onClick={() => void fetchItems()}>
                <RotateCcwIcon data-icon="inline-start" aria-hidden="true" />
                Try again
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {load.state === "ready" &&
        (items.length === 0 ? (
          <EmptyState
            icon={<PackageIcon />}
            title="No equipment yet"
            description="Add the first thing you rent out: a bike, a kayak, a golf cart…"
            action={
              <Button onClick={() => openPanel()}>
                <PlusIcon data-icon="inline-start" aria-hidden="true" />
                Add equipment
              </Button>
            }
          />
        ) : (
          <>
            <p className="text-body text-muted-foreground">
              {[
                totals.items > 0
                  ? `${plural(totals.items, "item", "items")} of your own · ${plural(totals.units, "unit", "units")}`
                  : "No items of your own yet",
                totals.demo > 0 &&
                  `${plural(totals.demo, "demo example", "demo examples")}, not saved when you approve`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <ul aria-label="Your equipment" className="flex flex-col gap-4">
              {items.map((item, index) => {
                const range = codes.get(item.id)
                return (
                  <EquipmentRow
                    key={item.id}
                    item={item}
                    codes={range ? codeRange(range) : ""}
                    defaultOpen={index === 0}
                    onEdit={() => openPanel(item)}
                    onRemove={() => void remove(item)}
                  />
                )
              })}
            </ul>
          </>
        ))}

      <EquipmentPanel
        key={panel.session}
        open={panel.open}
        onOpenChange={(open) => setPanel((p) => ({ ...p, open }))}
        item={panel.item}
        onSaved={replace}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Approve your equipment?"
        description={`We'll add ${plural(totals.items, "item", "items")} (${plural(totals.units, "unit", "units")}) to the panel and your booking page, and remove the demo data${
          totals.demo > 0
            ? `, including the ${plural(totals.demo, "demo example", "demo examples")} in this list`
            : ""
        }. You can change everything later in Equipment.`}
        confirmLabel="Approve and replace demo"
        pendingLabel="Approving…"
        onConfirm={async () => {
          await onboardingService.importEquipment()
          toast.success("Your equipment is in the system")
          router.push(SETUP_SETTINGS_HREF)
        }}
      />
    </>
  )
}

/** One item: a header that opens its prices (like a category of the draft review). */
function EquipmentRow({
  item,
  codes,
  defaultOpen,
  onEdit,
  onRemove,
}: {
  item: EquipmentItem
  codes: string
  defaultOpen: boolean
  onEdit: () => void
  onRemove: () => void
}) {
  return (
    <li>
      <Collapsible defaultOpen={defaultOpen} render={<Card size="sm" />}>
        <h2 className="px-(--card-spacing)">
          <CollapsibleTrigger className="group flex w-full flex-wrap items-center gap-x-4 gap-y-2 rounded-md text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring focus-visible:outline-solid">
            <ChevronDownIcon
              aria-hidden="true"
              className="size-4 shrink-0 -rotate-90 text-muted-foreground transition-transform duration-(--eq-duration-fast) group-data-panel-open:rotate-0"
            />
            <EquipmentThumbnail item={item} />
            <span className="flex min-w-48 flex-1 flex-col gap-1">
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-label text-foreground">{item.name}</span>
                {item.demo && <Badge variant="info">Demo data</Badge>}
              </span>
              <span className="text-body text-muted-foreground">
                {item.category} · {plural(item.units, "unit", "units")}:{" "}
                <span className="font-mono text-caption">{codes}</span>
              </span>
            </span>
            <span className="text-body text-foreground">{pricingSummary(item.pricing)}</span>
          </CollapsibleTrigger>
        </h2>
        <CollapsibleContent className="px-(--card-spacing)">
          <div className="flex flex-col gap-4 border-t border-border pt-4 sm:pl-8">
            <PricingBreakdown pricing={item.pricing} />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={onEdit}>
                <PencilIcon data-icon="inline-start" aria-hidden="true" />
                Edit prices and details
                <span className="sr-only">of {item.name}</span>
              </Button>
              <Button size="sm" variant="destructive" onClick={onRemove}>
                <Trash2Icon data-icon="inline-start" aria-hidden="true" />
                Remove
                <span className="sr-only">{item.name}</span>
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </li>
  )
}
