"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface FilterOption {
  value: string
  label: string
}

/** A Select for the FilterPanel; spread the FilterField props onto it (EQ toolbar pattern). */
export function FilterSelect({
  options,
  value,
  onValueChange,
  ...field
}: {
  options: FilterOption[]
  value: string
  onValueChange: (value: string) => void
} & React.ComponentProps<typeof SelectTrigger>) {
  return (
    <Select items={options} value={value} onValueChange={(v) => onValueChange(String(v))}>
      <SelectTrigger className="w-full" {...field}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
