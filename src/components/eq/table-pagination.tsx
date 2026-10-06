"use client"

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import * as React from "react"

import { IconButton } from "@/components/eq/icon-button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export interface TablePaginationOwnProps {
  /** Zero-based page index. */
  pageIndex: number
  pageSize: number
  /** Total rows across all pages. */
  rowCount: number
  onPageIndexChange: (pageIndex: number) => void
  onPageSizeChange?: (pageSize: number) => void
  /** @defaultValue [10, 25, 50] */
  pageSizeOptions?: number[]
  /** Noun for the range text, e.g. "orders". @defaultValue "rows" */
  itemLabel?: string
}

export type TablePaginationProps = TablePaginationOwnProps &
  Omit<React.ComponentProps<"nav">, keyof TablePaginationOwnProps>

/** Pagination for data tables: rows per page, "11–20 of 128", previous / next. */
function TablePagination({
  pageIndex,
  pageSize,
  rowCount,
  onPageIndexChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  itemLabel = "rows",
  className,
  "aria-label": ariaLabel = "Pagination",
  ...props
}: TablePaginationProps) {
  const sizeId = React.useId()
  const pageCount = Math.max(1, Math.ceil(rowCount / pageSize))
  const first = rowCount === 0 ? 0 : pageIndex * pageSize + 1
  const last = Math.min(rowCount, (pageIndex + 1) * pageSize)
  const sizes = pageSizeOptions.map((n) => ({ value: String(n), label: String(n) }))

  return (
    <nav
      data-slot="table-pagination"
      aria-label={ariaLabel}
      className={cn(
        "flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-body",
        className
      )}
      {...props}
    >
      <p className="text-muted-foreground" aria-live="polite">
        {first}–{last} of {rowCount} {itemLabel}
      </p>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span id={sizeId} className="text-muted-foreground">
              Rows per page
            </span>
            <Select
              items={sizes}
              value={String(pageSize)}
              onValueChange={(v) => {
                onPageSizeChange(Number(v))
                onPageIndexChange(0)
              }}
            >
              <SelectTrigger size="sm" aria-labelledby={sizeId} className="w-18">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sizes.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">
            Page {pageIndex + 1} of {pageCount}
          </span>
          <IconButton
            label="Previous page"
            icon={<ChevronLeftIcon />}
            size="sm"
            disabled={pageIndex === 0}
            onClick={() => onPageIndexChange(pageIndex - 1)}
          />
          <IconButton
            label="Next page"
            icon={<ChevronRightIcon />}
            size="sm"
            disabled={pageIndex >= pageCount - 1}
            onClick={() => onPageIndexChange(pageIndex + 1)}
          />
        </div>
      </div>
    </nav>
  )
}

export { TablePagination }
