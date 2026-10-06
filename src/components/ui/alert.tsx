import type * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const alertVariants = cva(
  "group/alert relative grid w-full gap-0.5 rounded-lg border px-4 py-3 text-left text-sm text-foreground has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2.5 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "border-border bg-card *:[svg]:text-muted-foreground",
        info: "border-transparent bg-info-subtle *:[svg]:text-info-text",
        success: "border-transparent bg-success-subtle *:[svg]:text-success-text",
        warning: "border-transparent bg-warning-subtle *:[svg]:text-warning-text",
        destructive: "border-transparent bg-destructive-subtle *:[svg]:text-destructive-text",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface AlertOwnProps {
  /** Role colour. Status is also carried by the icon and the title — never by colour alone. */
  variant?: VariantProps<typeof alertVariants>["variant"]
  /**
   * Announce the alert to screen readers when it appears. Leave `false` for alerts that are part of
   * the page on load; use `"polite"` for results of an action and `"assertive"` only for errors that
   * block the task.
   */
  announce?: false | "polite" | "assertive"
}

export type AlertProps = AlertOwnProps & Omit<React.ComponentProps<"div">, keyof AlertOwnProps>

function Alert({ className, variant, announce = false, ...props }: AlertProps) {
  const role = announce === "assertive" ? "alert" : announce === "polite" ? "status" : undefined
  return (
    <div
      data-slot="alert"
      data-variant={variant ?? "default"}
      role={role}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "font-medium group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-sm text-pretty text-foreground-secondary group-has-[>svg]/alert:col-start-2 [&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-3 [&_p:not(:last-child)]:mb-4",
        className
      )}
      {...props}
    />
  )
}

/**
 * Next step for the alert (one or two buttons), below the description. It stays in the flow
 * rather than in the corner, so it never covers the text — whatever the width or label length —
 * and is read after the message.
 */
function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn("mt-2 flex flex-wrap gap-2 group-has-[>svg]/alert:col-start-2", className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription, AlertAction, alertVariants }
