"use client"

import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible"
import { ChevronDownIcon, Maximize2Icon, PanelRightIcon, ColumnsIcon } from "lucide-react"
import * as React from "react"

import { ViewSwitch } from "@/components/eq/view-switch"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

export type EditPanelSize = "narrow" | "half" | "full"

const SIZE_OPTIONS = [
  { value: "full", label: "Full width", icon: <Maximize2Icon />, iconOnly: true },
  { value: "half", label: "Half width", icon: <ColumnsIcon />, iconOnly: true },
  { value: "narrow", label: "Narrow", icon: <PanelRightIcon />, iconOnly: true },
] as const

/** Width per size. Below `sm` the panel is always full width. */
const SIZE_CLASS: Record<EditPanelSize, string> = {
  narrow: "data-[side=right]:sm:max-w-lg",
  half: "data-[side=right]:sm:max-w-[max(32rem,50vw)]",
  full: "data-[side=right]:sm:max-w-none",
}

/** First editable form control in the body — where focus goes when the panel opens. */
const FIRST_FIELD = [
  // Base UI radios and checkboxes keep a hidden native input (tabindex -1, aria-hidden): skip it.
  'input:not([type="hidden"]):not([disabled]):not([readonly]):not([tabindex="-1"]):not([aria-hidden="true"])',
  "textarea:not([disabled]):not([readonly])",
  '[role="combobox"]:not([aria-disabled="true"])',
].join(", ")

export interface EditPanelProps {
  /** Element that opens the panel, e.g. `<Button>Add order</Button>`. Omit when controlled. */
  trigger?: React.ReactElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Verb + object: "Add order", "Edit order OR/2026/3148". */
  title: React.ReactNode
  /** Optional context under the title. */
  description?: React.ReactNode
  /** Width: `narrow` (default, the list stays visible), `half`, `full`. */
  size?: EditPanelSize
  defaultSize?: EditPanelSize
  onSizeChange?: (size: EditPanelSize) => void
  /** Actions, secondary first: `<Button variant="outline">Save and stay</Button><Button>Save</Button>`. */
  footer: React.ReactNode
  /**
   * The form has unsaved changes. Closing the panel by Escape, the close button or a click
   * outside then asks “Discard changes?” first. Closing it yourself (after Save) never asks.
   */
  dirty?: boolean
  /** Wording of the discard question. */
  discardText?: Partial<EditPanelDiscardText>
  /** Usually `EditPanelSection`s with `EditPanelFields`. */
  children: React.ReactNode
}

export interface EditPanelDiscardText {
  /** @defaultValue "Discard changes?" */
  title: string
  /** @defaultValue "What you entered in this panel will be lost." */
  description: string
  /** @defaultValue "Keep editing" */
  keep: string
  /** @defaultValue "Discard" */
  discard: string
}

const DISCARD_TEXT: EditPanelDiscardText = {
  title: "Discard changes?",
  description: "What you entered in this panel will be lost.",
  keep: "Keep editing",
  discard: "Discard",
}

/**
 * Side panel for adding or editing an item of a list, without leaving the list. A modal dialog:
 * focus moves to the first field, stays in the panel and returns to the trigger. Three widths;
 * fields reflow into 1, 2 or 4 columns with the panel's width (container queries).
 */
function EditPanel({
  trigger,
  open,
  onOpenChange,
  title,
  description,
  size: sizeProp,
  defaultSize = "narrow",
  onSizeChange,
  footer,
  dirty = false,
  discardText,
  children,
}: EditPanelProps) {
  const [openState, setOpenState] = React.useState(false)
  const isOpen = open ?? openState
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const keepRef = React.useRef<HTMLButtonElement>(null)
  const text = { ...DISCARD_TEXT, ...discardText }
  const [sizeState, setSizeState] = React.useState<EditPanelSize>(defaultSize)
  const size = sizeProp ?? sizeState
  const bodyRef = React.useRef<HTMLDivElement>(null)

  const setSize = (next: EditPanelSize) => {
    setSizeState(next)
    onSizeChange?.(next)
  }

  const setOpen = (next: boolean) => {
    setOpenState(next)
    onOpenChange?.(next)
  }

  // A user-initiated close (Escape, close button, outside click) on a dirty form asks first.
  const requestOpenChange = (next: boolean) => {
    if (!next && dirty) {
      setConfirmOpen(true)
      return
    }
    setOpen(next)
  }

  return (
    <Sheet open={isOpen} onOpenChange={requestOpenChange}>
      {trigger && <SheetTrigger render={trigger} />}
      <SheetContent
        side="right"
        data-slot="edit-panel"
        data-size={size}
        initialFocus={() => bodyRef.current?.querySelector<HTMLElement>(FIRST_FIELD) ?? true}
        className={cn("gap-0 data-[side=right]:w-full", SIZE_CLASS[size])}
      >
        <SheetHeader className="flex-row items-center gap-3 border-b border-border pr-14">
          <div className="min-w-0 flex-1">
            <SheetTitle>{title}</SheetTitle>
            {description && <SheetDescription>{description}</SheetDescription>}
          </div>
          <ViewSwitch
            aria-label="Panel width"
            options={SIZE_OPTIONS}
            value={size}
            onValueChange={setSize}
            className="hidden sm:flex"
          />
        </SheetHeader>
        <div
          ref={bodyRef}
          data-slot="edit-panel-body"
          className="@container flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4"
        >
          {children}
        </div>
        <SheetFooter
          data-slot="edit-panel-footer"
          className="mt-0 flex-row flex-wrap justify-end border-t border-border"
        >
          {footer}
        </SheetFooter>
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent data-slot="edit-panel-discard" initialFocus={keepRef}>
            <AlertDialogHeader>
              <AlertDialogTitle>{text.title}</AlertDialogTitle>
              <AlertDialogDescription>{text.description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel ref={keepRef}>{text.keep}</AlertDialogCancel>
              <Button
                variant="destructive-solid"
                onClick={() => {
                  setConfirmOpen(false)
                  setOpen(false)
                }}
              >
                {text.discard}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  )
}

export interface EditPanelSectionProps {
  /** Section heading, e.g. "Basic information". */
  title: string
  /** A lucide icon element shown before the title. */
  icon?: React.ReactNode
  /** Sections are open by default; collapse the ones most people skip. */
  defaultOpen?: boolean
  className?: string
  children: React.ReactNode
}

/** A collapsible group of fields inside an EditPanel. The heading is a button with aria-expanded. */
function EditPanelSection({
  title,
  icon,
  defaultOpen = true,
  className,
  children,
}: EditPanelSectionProps) {
  return (
    <CollapsiblePrimitive.Root
      defaultOpen={defaultOpen}
      render={
        <section
          data-slot="edit-panel-section"
          className={cn("w-full max-w-6xl rounded-lg border border-border bg-muted", className)}
        />
      }
    >
      <h3 className="text-label">
        <CollapsiblePrimitive.Trigger className="group flex w-full items-center gap-2 rounded-lg px-4 py-3 text-left font-medium text-foreground outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid [&_svg]:size-4 [&_svg]:shrink-0">
          {icon}
          <span className="flex-1">{title}</span>
          <ChevronDownIcon
            aria-hidden="true"
            className="text-muted-foreground transition-transform duration-(--eq-duration-fast) group-data-panel-open:rotate-180"
          />
        </CollapsiblePrimitive.Trigger>
      </h3>
      <CollapsiblePrimitive.Panel className="px-4 pb-4">{children}</CollapsiblePrimitive.Panel>
    </CollapsiblePrimitive.Root>
  )
}

/**
 * Grid of FormFields that follows the panel width: 1 column when narrow, 2 from 42rem, 4 from
 * 64rem. Wrap a field in `<div className="@2xl:col-span-2">` to make it wider.
 */
function EditPanelFields({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="edit-panel-fields"
      className={cn("grid gap-4 @2xl:grid-cols-2 @5xl:grid-cols-4", className)}
      {...props}
    />
  )
}

export { EditPanel, EditPanelSection, EditPanelFields }
