"use client"

import {
  PlusIcon,
  RotateCcwIcon,
  SearchXIcon,
  TicketPercentIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { ConfirmDialog } from "@/components/eq/confirm-dialog"
import { DataTable, dataTableColumns } from "@/components/eq/data-table"
import { EmptyState } from "@/components/eq/empty-state"
import { PageHeader } from "@/components/eq/page-header"
import {
  FilterField,
  FilterPanel,
  FilterToggle,
  Toolbar,
  ToolbarActions,
  ToolbarSearch,
} from "@/components/eq/toolbar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/sonner"
import {
  discountCodeRepository,
  formatValidity,
  formatValue,
  matchesQuery,
  STATUS_LABEL,
  statusOf,
  TYPE_LABEL,
  type DiscountCode,
  type DiscountStatus,
  type DiscountType,
} from "@/lib/discount-codes"

import { DiscountCodePanel } from "./discount-code-panel"
import { DiscountStatusBadge } from "./discount-status-badge"
import { FilterSelect, type FilterOption } from "./filter-select"
import { RowActions, type RowAction } from "./row-actions"

type Load =
  | { state: "loading" }
  | { state: "error"; message: string }
  | { state: "ready"; codes: DiscountCode[] }

type Pending = { action: "deactivate" | "delete"; code: DiscountCode } | null

const STATUS_OPTIONS: FilterOption[] = [
  { value: "all", label: "All statuses" },
  ...(Object.keys(STATUS_LABEL) as DiscountStatus[]).map((s) => ({
    value: s,
    label: STATUS_LABEL[s],
  })),
]
const TYPE_OPTIONS: FilterOption[] = [
  { value: "all", label: "All types" },
  ...(Object.keys(TYPE_LABEL) as DiscountType[]).map((t) => ({ value: t, label: TYPE_LABEL[t] })),
]

const getRowId = (code: DiscountCode) => code.id
const errorMessage = (err: unknown) =>
  err instanceof Error && err.message ? err.message : "Something went wrong. Try again."

/** Settings → Discount codes (WHLZ-566): list, search, filters, row actions. */
export function DiscountCodesView() {
  const [load, setLoad] = useState<Load>({ state: "loading" })
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("all")
  const [type, setType] = useState("all")
  // The code a dialog is about; kept after closing so the title doesn't change mid-animation.
  const [pending, setPending] = useState<Pending>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  // `session` re-mounts the panel on every opening, so it starts from the code it opens with.
  const [panel, setPanel] = useState<{ open: boolean; code?: DiscountCode; session: number }>({
    open: false,
    session: 0,
  })
  const openPanel = useCallback(
    (code?: DiscountCode) => setPanel((p) => ({ open: true, code, session: p.session + 1 })),
    []
  )

  const fetchCodes = useCallback(async () => {
    setLoad({ state: "loading" })
    try {
      setLoad({ state: "ready", codes: await discountCodeRepository.list() })
    } catch (err) {
      setLoad({ state: "error", message: errorMessage(err) })
    }
  }, [])

  useEffect(() => {
    // Load once on mount; the repository is async (mocked latency).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchCodes()
  }, [fetchCodes])

  const replace = useCallback((updated: DiscountCode) => {
    setLoad((l) =>
      l.state === "ready"
        ? { ...l, codes: l.codes.map((c) => (c.id === updated.id ? updated : c)) }
        : l
    )
  }, [])

  const setActive = useCallback(
    async (code: DiscountCode, active: boolean) => {
      const updated = await discountCodeRepository.setActive(code.id, active)
      replace(updated)
      toast.success(`Code ${code.code} ${active ? "activated" : "deactivated"}`, {
        action: {
          label: "Undo",
          onClick: () => {
            discountCodeRepository
              .setActive(code.id, !active)
              .then(replace)
              .catch((err: unknown) =>
                toast.error(`Couldn't undo the change to ${code.code}`, {
                  description: errorMessage(err),
                })
              )
          },
        },
      })
    },
    [replace]
  )

  const onAction = useCallback(
    (action: RowAction, code: DiscountCode) => {
      switch (action) {
        case "edit":
          openPanel(code)
          break
        case "copy":
          navigator.clipboard.writeText(code.code).then(
            () => toast.success(`Code ${code.code} copied`),
            () =>
              toast.error(`Couldn't copy ${code.code}`, {
                description: "Your browser blocked the clipboard. Select the code and copy it.",
              })
          )
          break
        case "activate":
          setActive(code, true).catch((err: unknown) =>
            toast.error(`Couldn't activate ${code.code}`, { description: errorMessage(err) })
          )
          break
        case "deactivate":
        case "delete":
          setPending({ action, code })
          setDialogOpen(true)
          break
      }
    },
    [setActive, openPanel]
  )

  const columns = useMemo(() => {
    const col = dataTableColumns<DiscountCode>()
    return col.columns([
      col.accessor("code", {
        header: "Code",
        sortFn: "alphanumeric",
        cell: (info) => <span className="font-mono font-medium">{info.getValue()}</span>,
      }),
      col.accessor("type", {
        header: "Type",
        enableSorting: false,
        cell: (info) => TYPE_LABEL[info.getValue()],
      }),
      col.accessor("value", {
        header: "Value",
        enableSorting: false,
        meta: { align: "end" },
        cell: (info) => formatValue(info.row.original),
      }),
      col.display({
        id: "validity",
        header: "Valid",
        cell: (info) => (
          <span className="text-muted-foreground">{formatValidity(info.row.original)}</span>
        ),
      }),
      col.accessor("uses", { header: "Uses", meta: { align: "end" } }),
      col.display({
        id: "status",
        header: "Status",
        cell: (info) => <DiscountStatusBadge status={statusOf(info.row.original)} />,
      }),
      col.display({
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: (info) => (
          <div className="flex justify-end">
            <RowActions code={info.row.original} onAction={onAction} />
          </div>
        ),
      }),
    ])
  }, [onAction])

  const codes = useMemo(() => (load.state === "ready" ? load.codes : []), [load])
  const rows = useMemo(
    () =>
      codes.filter(
        (c) =>
          matchesQuery(c, query) &&
          (status === "all" || statusOf(c) === status) &&
          (type === "all" || c.type === type)
      ),
    [codes, query, status, type]
  )
  const activeFilters = Number(status !== "all") + Number(type !== "all")
  const filtering = activeFilters > 0 || query.trim() !== ""

  const clearFilters = () => {
    setStatus("all")
    setType("all")
  }
  const clearAll = () => {
    clearFilters()
    setQuery("")
    searchRef.current?.focus()
  }

  return (
    <div className="flex flex-col gap-(--eq-page-header-gap)">
      <PageHeader
        title="Discount codes"
        description="Reusable codes clients enter at checkout, or you add to an order."
        primaryAction={
          <Button onClick={() => openPanel()} disabled={load.state !== "ready"}>
            <PlusIcon data-icon="inline-start" aria-hidden="true" />
            Add code
          </Button>
        }
      />

      {load.state === "error" ? (
        <Alert variant="destructive" announce="assertive">
          <TriangleAlertIcon aria-hidden="true" />
          <AlertTitle>Discount codes couldn&apos;t be loaded</AlertTitle>
          <AlertDescription>
            <p>{load.message}</p>
            {/* Below the text, not in AlertAction: AlertAction overlaps the title at 320–375px
                (reported to EQ-librium). */}
            <div>
              <Button size="sm" variant="outline" onClick={() => void fetchCodes()}>
                <RotateCcwIcon data-icon="inline-start" aria-hidden="true" />
                Try again
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <Toolbar>
            <ToolbarSearch
              ref={searchRef}
              label="Search codes"
              placeholder="Search codes…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <ToolbarActions>
              <FilterToggle count={activeFilters} />
            </ToolbarActions>
            <FilterPanel onClear={clearFilters}>
              <FilterField label="Status">
                {(field) => (
                  <FilterSelect
                    {...field}
                    options={STATUS_OPTIONS}
                    value={status}
                    onValueChange={setStatus}
                  />
                )}
              </FilterField>
              <FilterField label="Type">
                {(field) => (
                  <FilterSelect
                    {...field}
                    options={TYPE_OPTIONS}
                    value={type}
                    onValueChange={setType}
                  />
                )}
              </FilterField>
            </FilterPanel>
          </Toolbar>

          <DataTable
            label="Discount codes"
            columns={columns}
            data={rows}
            getRowId={getRowId}
            itemLabel="codes"
            loading={load.state === "loading"}
            empty={
              filtering ? (
                <EmptyState
                  icon={<SearchXIcon />}
                  title="No codes match"
                  description="Try another search, or clear the filters to see every code."
                  action={
                    <Button variant="outline" onClick={clearAll}>
                      Clear search and filters
                    </Button>
                  }
                />
              ) : (
                <EmptyState
                  icon={<TicketPercentIcon />}
                  title="No discount codes yet"
                  description="Add a code, then share it with clients — they enter it on the booking page."
                  action={
                    <Button onClick={() => openPanel()}>
                      <PlusIcon data-icon="inline-start" aria-hidden="true" />
                      Add code
                    </Button>
                  }
                />
              )
            }
          />
          {/* The table's own range text shows counts; this announces filter results. */}
          <p className="sr-only" aria-live="polite">
            {load.state === "ready" && filtering
              ? `${rows.length} of ${codes.length} codes match`
              : ""}
          </p>
        </>
      )}

      <DiscountCodePanel
        key={panel.session}
        open={panel.open}
        onOpenChange={(open) => setPanel((p) => ({ ...p, open }))}
        code={panel.code}
        existing={codes}
        onSaved={(saved, created) =>
          setLoad((l) =>
            l.state === "ready"
              ? {
                  ...l,
                  codes: created
                    ? [saved, ...l.codes]
                    : l.codes.map((c) => (c.id === saved.id ? saved : c)),
                }
              : l
          )
        }
      />
      <ConfirmDialog
        open={dialogOpen && pending?.action === "deactivate"}
        onOpenChange={setDialogOpen}
        title={`Deactivate code ${pending?.code.code ?? ""}?`}
        description="Clients can no longer use it at checkout. Orders that already use it keep their discount. You can activate it again at any time."
        confirmLabel="Deactivate code"
        pendingLabel="Deactivating…"
        onConfirm={async () => {
          if (pending) await setActive(pending.code, false)
        }}
      />
      <ConfirmDialog
        open={dialogOpen && pending?.action === "delete"}
        onOpenChange={setDialogOpen}
        tone="destructive"
        title={`Delete code ${pending?.code.code ?? ""}?`}
        description="It has never been used, so no order is affected. This can't be undone."
        confirmLabel="Delete code"
        pendingLabel="Deleting…"
        onConfirm={async () => {
          if (!pending) return
          const { code } = pending
          await discountCodeRepository.remove(code.id)
          setLoad((l) =>
            l.state === "ready" ? { ...l, codes: l.codes.filter((c) => c.id !== code.id) } : l
          )
          toast.success(`Code ${code.code} deleted`)
          // The row is gone, so focus can't return to its menu; continue from the search field.
          requestAnimationFrame(() => searchRef.current?.focus())
        }}
      />
    </div>
  )
}
