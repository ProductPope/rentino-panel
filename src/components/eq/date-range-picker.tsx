"use client"

import { CalendarIcon } from "lucide-react"
import * as React from "react"
import type { DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export type { DateRange }

export interface DateRangePickerOwnProps {
  /** Selected range. `undefined` = no range. */
  value: DateRange | undefined
  onValueChange: (value: DateRange | undefined) => void
  /** Shown when no range is selected. */
  placeholder?: string
  /** BCP 47 locale for the trigger label, e.g. "pl-PL". Defaults to the browser locale. */
  locale?: string
  /** Months shown side by side. @defaultValue 2 */
  numberOfMonths?: number
  disabled?: boolean
}

export type DateRangePickerProps = DateRangePickerOwnProps &
  Omit<React.ComponentProps<"button">, keyof DateRangePickerOwnProps | "children" | "value">

function formatRange(range: DateRange | undefined, locale: string | undefined) {
  const format = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
  if (range?.from && range.to) return format.formatRange(range.from, range.to)
  // Open-ended ranges say which end is open, so a start date never reads as a single day.
  if (range?.from) return `From ${format.format(range.from)}`
  if (range?.to) return `Until ${format.format(range.to)}`
  return null
}

/**
 * Date range field: a trigger styled like an input that opens a two-month calendar.
 * Works inside FormField / FilterField — spread the field's control props onto it.
 */
function DateRangePicker({
  value,
  onValueChange,
  placeholder = "Pick a date range",
  locale,
  numberOfMonths = 2,
  disabled,
  className,
  "aria-required": ariaRequired,
  "aria-describedby": ariaDescribedBy,
  ...props
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  // The trigger is a button, where aria-required is not allowed: say "Required" in its description.
  const requiredId = React.useId()
  const required = ariaRequired === true || ariaRequired === "true"
  const describedBy = [ariaDescribedBy, required ? requiredId : undefined].filter(Boolean).join(" ")
  const label = formatRange(value, locale)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        render={
          <button
            type="button"
            data-slot="date-range-picker"
            data-placeholder={label ? undefined : ""}
            className={cn(
              "flex h-9 w-full min-w-0 items-center gap-2 rounded-md border border-input bg-transparent px-2.5 text-left text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive aria-invalid:focus-visible:border-ring aria-invalid:focus-visible:ring-ring data-placeholder:text-muted-foreground dark:bg-muted [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
              className
            )}
            aria-describedby={describedBy || undefined}
            {...props}
          />
        }
      >
        {required && (
          <span id={requiredId} hidden>
            Required
          </span>
        )}
        <CalendarIcon aria-hidden="true" />
        <span className="truncate">{label ?? placeholder}</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto gap-0 p-0">
        <Calendar
          mode="range"
          numberOfMonths={numberOfMonths}
          selected={value}
          onSelect={onValueChange}
          defaultMonth={value?.from ?? value?.to}
        />
        <div className="flex items-center justify-between gap-2 border-t border-border p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onValueChange(undefined)}
            disabled={!value?.from && !value?.to}
          >
            Clear
          </Button>
          <Button size="sm" onClick={() => setOpen(false)}>
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { DateRangePicker }
