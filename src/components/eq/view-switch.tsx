"use client"

import type * as React from "react"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export interface ViewSwitchOption<T extends string> {
  value: T
  label: string
  icon?: React.ReactNode
  /** Show only the icon; `label` stays the accessible name and is shown as a tooltip. */
  iconOnly?: boolean
}

export interface ViewSwitchProps<T extends string> {
  /** Accessible name of the group, e.g. "Layout". */
  "aria-label": string
  options: readonly ViewSwitchOption<T>[]
  value: T
  onValueChange: (value: T) => void
  className?: string
}

/**
 * Switches how the same data is presented (list ⇄ grid). Exactly one option is always selected.
 * Not navigation: if the views change the available tools, use Tabs; if they are pages, SectionNav.
 */
function ViewSwitch<T extends string>({
  options,
  value,
  onValueChange,
  className,
  ...props
}: ViewSwitchProps<T>) {
  return (
    <ToggleGroup
      data-slot="view-switch"
      value={[value]}
      onValueChange={(next) => {
        // A view switch never ends up empty: ignore attempts to unpress the active option.
        const picked = next.find((v) => v !== value) ?? next[0]
        if (picked !== undefined && picked !== value) onValueChange(picked as T)
      }}
      spacing={0}
      className={cn("h-9 rounded-md bg-muted p-0.5", className)}
      {...props}
    >
      {options.map((option) => {
        const item = (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            size="sm"
            aria-label={option.iconOnly ? option.label : undefined}
            className="h-8 rounded-[calc(var(--radius-md)-2px)]! text-muted-foreground hover:bg-transparent aria-pressed:bg-card aria-pressed:text-foreground aria-pressed:shadow-xs"
          >
            {option.icon}
            {!option.iconOnly && option.label}
          </ToggleGroupItem>
        )
        if (!option.iconOnly) return item
        return (
          <Tooltip key={option.value}>
            <TooltipTrigger render={item} />
            <TooltipContent>{option.label}</TooltipContent>
          </Tooltip>
        )
      })}
    </ToggleGroup>
  )
}

export { ViewSwitch }
