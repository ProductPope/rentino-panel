"use client"

import * as React from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export interface ConfirmDialogProps {
  /** The element that opens the dialog, e.g. `<Button variant="destructive">Delete</Button>`. */
  trigger?: React.ReactElement
  /** Controlled open state. Leave unset to let the trigger control it. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** A question naming the object: "Delete code SUMMER24?" */
  title: React.ReactNode
  /** The consequence, in plain words: what happens and whether it can be undone. */
  description: React.ReactNode
  /** Verb + object, matching the title: "Delete code". Never "OK" or "Yes". */
  confirmLabel: string
  /** Progressive label while `onConfirm` is pending, e.g. "Deleting…". Defaults to `confirmLabel`. */
  pendingLabel?: string
  cancelLabel?: string
  /** `destructive` uses the solid destructive fill — the only place it is allowed. */
  tone?: "default" | "destructive"
  /**
   * Runs on confirm. Return a promise to keep the dialog open with a loading button until it
   * settles; if it rejects, the dialog stays open and shows the error's message.
   */
  onConfirm: () => void | Promise<void>
}

/**
 * Asks for confirmation before an action that is destructive or hard to undo. Focus starts on
 * Cancel, Escape cancels, and focus returns to the trigger when the dialog closes.
 */
function ConfirmDialog({
  trigger,
  open: openProp,
  onOpenChange,
  title,
  description,
  confirmLabel,
  pendingLabel,
  cancelLabel = "Cancel",
  tone = "default",
  onConfirm,
}: ConfirmDialogProps) {
  const [openState, setOpenState] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const cancelRef = React.useRef<HTMLButtonElement>(null)
  const open = openProp ?? openState

  const setOpen = (next: boolean) => {
    if (pending && !next) return
    if (next) setError(null)
    setOpenState(next)
    onOpenChange?.(next)
  }

  const confirm = async () => {
    setError(null)
    setPending(true)
    try {
      await onConfirm()
      setPending(false)
      setOpenState(false)
      onOpenChange?.(false)
    } catch (err) {
      setPending(false)
      setError(
        err instanceof Error && err.message ? err.message : "Something went wrong. Try again."
      )
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {trigger && <AlertDialogTrigger render={trigger} />}
      <AlertDialogContent data-slot="confirm-dialog" initialFocus={cancelRef}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <Alert variant="destructive" announce="assertive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel ref={cancelRef} disabled={pending}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            variant={tone === "destructive" ? "destructive-solid" : "default"}
            loading={pending}
            onClick={confirm}
          >
            {pending ? (pendingLabel ?? confirmLabel) : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export { ConfirmDialog }
