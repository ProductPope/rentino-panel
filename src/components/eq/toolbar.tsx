"use client"

import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible"
import { SearchIcon, SlidersHorizontalIcon } from "lucide-react"
import * as React from "react"

import { FormField, type FormFieldProps } from "@/components/eq/form-field"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

/**
 * Below the md breakpoint the filter panel is a bottom sheet (a modal dialog) instead of an inline
 * panel: an inline panel would push the results off a phone screen. The sheet always starts closed.
 */
interface ToolbarContextValue {
  isMobile: boolean
  sheetOpen: boolean
  setSheetOpen: (open: boolean) => void
}

const ToolbarContext = React.createContext<ToolbarContextValue>({
  isMobile: false,
  sheetOpen: false,
  setSheetOpen: () => {},
})

export interface ToolbarOwnProps {
  /** Controlled open state of the filter panel. */
  filtersOpen?: boolean
  /** Initial open state. Filters are collapsed by default; open them only where filtering is the main task. */
  defaultFiltersOpen?: boolean
  onFiltersOpenChange?: (open: boolean) => void
}

export type ToolbarProps = ToolbarOwnProps &
  Omit<React.ComponentProps<"div">, keyof ToolbarOwnProps>

/**
 * The one toolbar under the PageHeader. Fixed grammar: search on the left, controls on the right,
 * filters expand into a panel below. Compose with ToolbarSearch, ToolbarActions, FilterToggle, FilterPanel.
 */
function Toolbar({
  filtersOpen,
  defaultFiltersOpen = false,
  onFiltersOpenChange,
  className,
  children,
  ...props
}: ToolbarProps) {
  const isMobile = useIsMobile()
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const context = React.useMemo(
    () => ({ isMobile, sheetOpen, setSheetOpen }),
    [isMobile, sheetOpen]
  )
  const rowClassName = cn("flex w-full flex-wrap items-center gap-x-2.5 gap-y-3", className)

  return (
    <ToolbarContext.Provider value={context}>
      {isMobile ? (
        <div data-slot="toolbar" className={rowClassName} {...props}>
          {children}
        </div>
      ) : (
        <CollapsiblePrimitive.Root
          {...(filtersOpen !== undefined ? { open: filtersOpen } : {})}
          defaultOpen={defaultFiltersOpen}
          onOpenChange={(open) => onFiltersOpenChange?.(open)}
          render={<div data-slot="toolbar" className={rowClassName} {...props} />}
        >
          {children}
        </CollapsiblePrimitive.Root>
      )}
    </ToolbarContext.Provider>
  )
}

export interface ToolbarSearchOwnProps {
  /** Accessible name of the field. Defaults to "Search". */
  label?: string
  /** @defaultValue "Search…" */
  placeholder?: string
}

export type ToolbarSearchProps = ToolbarSearchOwnProps &
  Omit<React.ComponentProps<"input">, keyof ToolbarSearchOwnProps | "type">

/** Search field: leading magnifier, grows up to 420px. */
function ToolbarSearch({
  label = "Search",
  placeholder = "Search…",
  className,
  ...props
}: ToolbarSearchProps) {
  return (
    <InputGroup
      data-slot="toolbar-search"
      className={cn("min-w-48 flex-1 bg-card md:max-w-(--eq-toolbar-search-max-width)", className)}
    >
      <InputGroupAddon>
        <SearchIcon aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupInput type="search" aria-label={label} placeholder={placeholder} {...props} />
    </InputGroup>
  )
}

/** Right-hand controls: ViewSwitch, FilterToggle, IconButtons — in that order. */
function ToolbarActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="toolbar-actions"
      className={cn("ml-auto flex shrink-0 items-center gap-2", className)}
      {...props}
    />
  )
}

export interface FilterToggleOwnProps {
  /** Number of active filters, shown as a pill. */
  count?: number
  /** @defaultValue "Filters" */
  label?: string
}

export type FilterToggleProps = FilterToggleOwnProps &
  Omit<React.ComponentProps<typeof Button>, keyof FilterToggleOwnProps | "children">

function FilterToggleContent({ count, label }: { count: number; label: string }) {
  return (
    <>
      <SlidersHorizontalIcon aria-hidden="true" data-icon="inline-start" />
      {label}
      {count > 0 && (
        <>
          <span
            aria-hidden="true"
            className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 font-mono text-caption text-primary-foreground"
          >
            {count}
          </span>
          <span className="sr-only">({count} active)</span>
        </>
      )}
    </>
  )
}

/**
 * Opens/closes the FilterPanel, announcing its state via aria-expanded. Below md it opens the
 * filters sheet (aria-haspopup="dialog").
 */
function FilterToggle({ count = 0, label = "Filters", className, ...props }: FilterToggleProps) {
  const { isMobile, sheetOpen, setSheetOpen } = React.useContext(ToolbarContext)
  const pressed =
    "data-panel-open:border-primary-text/30 data-panel-open:bg-primary-subtle data-panel-open:text-primary-text"

  if (isMobile) {
    return (
      <Button
        data-slot="filter-toggle"
        variant="outline"
        aria-haspopup="dialog"
        aria-expanded={sheetOpen}
        className={className}
        {...props}
        onClick={(event) => {
          props.onClick?.(event)
          setSheetOpen(true)
        }}
      >
        <FilterToggleContent count={count} label={label} />
      </Button>
    )
  }

  return (
    <CollapsiblePrimitive.Trigger
      render={
        <Button
          data-slot="filter-toggle"
          variant="outline"
          className={cn(pressed, className)}
          {...props}
        />
      }
    >
      <FilterToggleContent count={count} label={label} />
    </CollapsiblePrimitive.Trigger>
  )
}

export interface FilterPanelOwnProps {
  /** Called by "Clear filters". The button is always present when the panel exists. */
  onClear?: () => void
  /** @defaultValue "Clear filters" */
  clearLabel?: string
  /** Title of the filters sheet on small screens. @defaultValue "Filters" */
  sheetTitle?: string
  /** Closes the sheet on small screens. Filters apply as they change. @defaultValue "Show results" */
  doneLabel?: string
}

export type FilterPanelProps = FilterPanelOwnProps &
  Omit<React.ComponentProps<"div">, keyof FilterPanelOwnProps>

/**
 * Collapsible panel below the toolbar row: auto-fit grid of FilterFields + Clear filters.
 * Below md the same fields render in a bottom sheet with Clear filters and a done button.
 */
function FilterPanel({
  onClear,
  clearLabel = "Clear filters",
  sheetTitle = "Filters",
  doneLabel = "Show results",
  className,
  children,
  ...props
}: FilterPanelProps) {
  const { isMobile, sheetOpen, setSheetOpen } = React.useContext(ToolbarContext)

  if (isMobile) {
    return (
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          data-slot="filter-sheet"
          className="max-h-[85dvh] overflow-y-auto rounded-t-xl"
        >
          <SheetHeader>
            <SheetTitle>{sheetTitle}</SheetTitle>
            <SheetDescription>Results update as you change a filter.</SheetDescription>
          </SheetHeader>
          <div className={cn("grid gap-4 px-4", className)} {...props}>
            {children}
          </div>
          <SheetFooter className="flex-row justify-between">
            <Button variant="ghost" onClick={onClear}>
              {clearLabel}
            </Button>
            <Button onClick={() => setSheetOpen(false)}>{doneLabel}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <CollapsiblePrimitive.Panel
      render={
        <div
          data-slot="filter-panel"
          className={cn("basis-full rounded-lg border border-border bg-card p-4", className)}
          {...props}
        />
      }
    >
      <div className="grid grid-cols-[repeat(auto-fit,minmax(var(--eq-toolbar-filter-column-min),1fr))] gap-4">
        {children}
      </div>
      <Button variant="ghost" size="sm" className="mt-4 -ml-2" onClick={onClear}>
        {clearLabel}
      </Button>
    </CollapsiblePrimitive.Panel>
  )
}

export type FilterFieldProps = Omit<FormFieldProps, "size">

/** A labelled control inside the FilterPanel — a compact FormField. */
function FilterField(props: FilterFieldProps) {
  return <FormField size="compact" {...props} />
}

export { Toolbar, ToolbarSearch, ToolbarActions, FilterToggle, FilterPanel, FilterField }
