"use client"

import type * as React from "react"
import {
  CircleCheckIcon,
  InfoIcon,
  LoaderCircleIcon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import {
  Toaster as Sonner,
  toast as sonnerToast,
  type ExternalToast,
  type ToasterProps,
} from "sonner"

/**
 * Toast region. Mount once, near the root of the app. Colours come from the `popover` surface,
 * so toasts follow whichever theme (`.dark` / `.light`) the region sits in.
 *
 * Top centre by default: bottom-right covers the actions of an EditPanel footer (Save) and
 * bottom-left crowds the sidebar footer.
 */
function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      position="top-center"
      closeButton
      icons={{
        success: <CircleCheckIcon className="size-4 text-success-text" aria-hidden="true" />,
        info: <InfoIcon className="size-4 text-info-text" aria-hidden="true" />,
        warning: <TriangleAlertIcon className="size-4 text-warning-text" aria-hidden="true" />,
        error: <OctagonXIcon className="size-4 text-destructive-text" aria-hidden="true" />,
        loading: (
          <LoaderCircleIcon
            className="size-4 animate-spin text-muted-foreground motion-reduce:animate-none"
            aria-hidden="true"
          />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "font-sans shadow-lg",
          title: "font-medium text-foreground",
          description: "text-foreground-secondary!",
          // 24px target (WCAG 2.5.8; sonner draws 20px), token hover and focus ring.
          closeButton:
            "size-6! hover:border-border! hover:bg-accent! hover:text-accent-foreground! focus-visible:outline-2! focus-visible:outline-offset-2! focus-visible:outline-ring! focus-visible:outline-solid! [&_svg]:size-3.5",
        },
      }}
      {...props}
    />
  )
}

/**
 * A toast with an action stays until dismissed (WCAG 2.2.1 Timing adjustable): the user must have
 * time to reach the action. Pass an explicit `duration` to opt out.
 */
function withDefaults(data?: ExternalToast): ExternalToast | undefined {
  return data?.action && data.duration === undefined ? { ...data, duration: Infinity } : data
}

type Message = Parameters<typeof sonnerToast>[0]

/** Show a toast. Same API as sonner's `toast`, with EQ defaults. */
const toast = Object.assign(
  (message: Message, data?: ExternalToast) => sonnerToast(message, withDefaults(data)),
  {
    success: (message: Message, data?: ExternalToast) =>
      sonnerToast.success(message, withDefaults(data)),
    info: (message: Message, data?: ExternalToast) => sonnerToast.info(message, withDefaults(data)),
    warning: (message: Message, data?: ExternalToast) =>
      sonnerToast.warning(message, withDefaults(data)),
    error: (message: Message, data?: ExternalToast) =>
      sonnerToast.error(message, withDefaults(data)),
    loading: sonnerToast.loading,
    promise: sonnerToast.promise,
    dismiss: sonnerToast.dismiss,
  }
)

export { Toaster, toast }
