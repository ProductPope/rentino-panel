"use client"

import type * as React from "react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

type ButtonProps = React.ComponentProps<typeof Button>

export interface IconButtonOwnProps {
  /**
   * What the button does ("Export", "Download QR"). Required: it becomes the accessible name
   * (`aria-label`) and the tooltip. Icon-only buttons are never label-less.
   */
  label: string
  /** A lucide icon element, e.g. `<Download />`. */
  icon: React.ReactNode
  /** `default` = 36px (header/toolbar row), `sm` = 32px. */
  size?: "default" | "sm"
  /** Tooltip placement. */
  tooltipSide?: React.ComponentProps<typeof TooltipContent>["side"]
  /** Visual variant, as on Button. Outline by default (toolbar style). */
  variant?: ButtonProps["variant"]
}

export type IconButtonProps = IconButtonOwnProps &
  Omit<ButtonProps, keyof IconButtonOwnProps | "children" | "aria-label">

/** Icon-only button with a mandatory tooltip + aria-label. Outline by default, as in the toolbar. */
function IconButton({
  label,
  icon,
  size = "default",
  variant = "outline",
  tooltipSide = "top",
  ...props
}: IconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            data-slot="icon-button"
            variant={variant}
            size={size === "sm" ? "icon-sm" : "icon"}
            aria-label={label}
            {...props}
          />
        }
      >
        {icon}
      </TooltipTrigger>
      <TooltipContent side={tooltipSide}>{label}</TooltipContent>
    </Tooltip>
  )
}

export { IconButton }
