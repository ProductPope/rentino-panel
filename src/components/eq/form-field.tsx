"use client"

import * as React from "react"

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { cn } from "@/lib/utils"

/** Props FormField hands to its control — spread them onto the input, select trigger or picker. */
export interface FormFieldControlProps {
  id: string
  /**
   * Also points at the label: overlay managers (Base UI popups) set aria-hidden on everything outside
   * the popup, label included — a name from aria-labelledby survives that, htmlFor alone does not.
   */
  "aria-labelledby": string
  "aria-describedby"?: string
  "aria-invalid"?: true
  "aria-required"?: true
  disabled?: boolean
}

export interface FormFieldOwnProps {
  /** Visible label. Always present — placeholders are not labels. */
  label: React.ReactNode
  /** Help text under the control, linked with aria-describedby. */
  description?: React.ReactNode
  /** Error message. When set, the field is invalid: red border, aria-invalid, message announced. */
  error?: React.ReactNode
  /** Marks the field required (aria-required + a visual marker). */
  required?: boolean
  disabled?: boolean
  /** `default` for forms; `compact` (small muted label) for filter panels. */
  size?: "default" | "compact"
  /** Render the control and spread the given props onto it. */
  children: (control: FormFieldControlProps) => React.ReactNode
}

export type FormFieldProps = FormFieldOwnProps &
  Omit<React.ComponentProps<"div">, keyof FormFieldOwnProps>

/**
 * A labelled form control with description and error, wired for assistive technology:
 * label → htmlFor, description and error → aria-describedby, error → aria-invalid.
 */
function FormField({
  label,
  description,
  error,
  required = false,
  disabled = false,
  size = "default",
  children,
  className,
  ...props
}: FormFieldProps) {
  const id = React.useId()
  const labelId = `${id}-label`
  const descriptionId = description != null ? `${id}-description` : undefined
  const errorId = error != null ? `${id}-error` : undefined
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined

  return (
    <Field
      data-slot="form-field"
      data-invalid={error != null || undefined}
      data-disabled={disabled || undefined}
      className={cn(size === "compact" && "gap-1.5", className)}
      {...props}
    >
      <FieldLabel
        id={labelId}
        htmlFor={id}
        className={cn(size === "compact" && "text-caption font-medium text-muted-foreground")}
      >
        {label}
        {required && (
          <span aria-hidden="true" className="text-destructive-text">
            *
          </span>
        )}
      </FieldLabel>
      {children({
        id,
        "aria-labelledby": labelId,
        ...(describedBy ? { "aria-describedby": describedBy } : {}),
        ...(error != null ? { "aria-invalid": true as const } : {}),
        ...(required ? { "aria-required": true as const } : {}),
        ...(disabled ? { disabled } : {}),
      })}
      {description != null && <FieldDescription id={descriptionId}>{description}</FieldDescription>}
      {error != null && <FieldError id={errorId}>{error}</FieldError>}
    </Field>
  )
}

export { FormField }
