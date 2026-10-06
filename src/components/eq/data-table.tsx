"use client"

import {
  createColumnHelper,
  createPaginatedRowModel,
  createSortedRowModel,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
  useTable,
  type ColumnDef,
  type PaginationState,
  type RowData,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table"
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react"
import * as React from "react"

import { TablePagination } from "@/components/eq/table-pagination"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

/** Features every DataTable registers: client sorting, pagination and row selection. */
export const dataTableFeatures = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
})

type Features = typeof dataTableFeatures

/** Typed column helper for DataTable columns: `const col = dataTableColumns<Order>()`. */
export function dataTableColumns<TData extends RowData>() {
  return createColumnHelper<Features, TData>()
}

/** Put in a column's `meta`. */
export interface DataTableColumnMeta {
  /** Numbers and amounts align to the end. */
  align?: "start" | "end"
}

export type DataTableColumnDef<TData extends RowData> = ColumnDef<Features, TData, any> // eslint-disable-line @typescript-eslint/no-explicit-any

export interface DataTableOwnProps<TData extends RowData> {
  /** Accessible name of the table, e.g. "Orders". Required. */
  label: string
  columns: DataTableColumnDef<TData>[]
  data: TData[]
  /** Stable row id (database id) — used for selection and keys. */
  getRowId: (row: TData) => string
  /** Human name of a row for its selection checkbox: "Select order OR/2026/3148". */
  getRowLabel?: (row: TData) => string
  initialSorting?: SortingState
  /** @defaultValue 10 */
  pageSize?: number
  pageSizeOptions?: number[]
  /** Noun for the pagination range text. */
  itemLabel?: string
  /** Adds a checkbox column; selected ids are reported here. */
  onSelectionChange?: (selectedIds: string[]) => void
  /** Shows skeleton rows and marks the table busy. */
  loading?: boolean
  /** Rendered in the body when there are no rows (and not loading) — usually an EmptyState. */
  empty?: React.ReactNode
  className?: string
}

const SORT_LABEL = { asc: "ascending", desc: "descending" } as const

/**
 * Data table: sortable columns (buttons in headers, `aria-sort`), optional row selection with labelled
 * checkboxes, client pagination, loading and empty states. Sorting and paging changes are announced.
 */
function DataTable<TData extends RowData>({
  label,
  columns,
  data,
  getRowId,
  getRowLabel,
  initialSorting = [],
  pageSize: initialPageSize = 10,
  pageSizeOptions,
  itemLabel,
  onSelectionChange,
  loading = false,
  empty,
  className,
}: DataTableOwnProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting)
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  })
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [announcement, setAnnouncement] = React.useState("")
  const selectable = onSelectionChange !== undefined

  const table = useTable({
    features: dataTableFeatures,
    columns,
    data,
    getRowId,
    state: { sorting, pagination, rowSelection },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: selectable,
  })

  React.useEffect(() => {
    onSelectionChange?.(Object.keys(rowSelection).filter((id) => rowSelection[id]))
  }, [rowSelection, onSelectionChange])

  const rows = table.getRowModel().rows
  const leafCount = table.getAllLeafColumns().length
  const colSpan = leafCount + (selectable ? 1 : 0)
  const headerText = (id: string) => {
    const header = table.getFlatHeaders().find((h) => h.column.id === id)
    const def = header?.column.columnDef.header
    return typeof def === "string" ? def : id
  }

  return (
    <div data-slot="data-table" className={cn("flex flex-col gap-3", className)}>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <Table aria-label={label} aria-busy={loading || undefined}>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {selectable && (
                  <TableHead className="w-10">
                    <Checkbox
                      aria-label="Select all rows on this page"
                      checked={table.getIsAllPageRowsSelected()}
                      indeterminate={
                        !table.getIsAllPageRowsSelected() && table.getIsSomePageRowsSelected()
                      }
                      onCheckedChange={(checked) =>
                        table.toggleAllPageRowsSelected(Boolean(checked))
                      }
                      disabled={loading || rows.length === 0}
                    />
                  </TableHead>
                )}
                {group.headers.map((header) => {
                  const meta = header.column.columnDef.meta as DataTableColumnMeta | undefined
                  const sorted = header.column.getIsSorted()
                  const canSort = header.column.getCanSort()
                  const content = header.isPlaceholder ? null : <table.FlexRender header={header} />
                  return (
                    <TableHead
                      key={header.id}
                      aria-sort={
                        canSort
                          ? sorted === "asc"
                            ? "ascending"
                            : sorted === "desc"
                              ? "descending"
                              : "none"
                          : undefined
                      }
                      className={cn(meta?.align === "end" && "text-right")}
                    >
                      {canSort ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            const next = header.column.getNextSortingOrder()
                            header.column.getToggleSortingHandler()?.(event)
                            setAnnouncement(
                              next
                                ? `Sorted by ${headerText(header.column.id)}, ${SORT_LABEL[next]}`
                                : "Sorting removed"
                            )
                          }}
                          className={cn(
                            "-mx-1.5 inline-flex h-8 items-center gap-1.5 rounded-md px-1.5 font-medium text-foreground outline-none hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid [&_svg]:size-3.5 [&_svg]:text-muted-foreground",
                            meta?.align === "end" && "flex-row-reverse"
                          )}
                        >
                          {content}
                          {sorted === "asc" ? (
                            <ArrowUpIcon aria-hidden="true" />
                          ) : sorted === "desc" ? (
                            <ArrowDownIcon aria-hidden="true" />
                          ) : (
                            <ArrowUpDownIcon aria-hidden="true" />
                          )}
                        </button>
                      ) : (
                        content
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: pagination.pageSize > 5 ? 5 : pagination.pageSize }, (_, i) => (
                <TableRow key={`skeleton-${i}`} aria-hidden="true">
                  {Array.from({ length: colSpan }, (_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full max-w-32" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="p-6 whitespace-normal">
                  {empty ?? <p className="text-center text-muted-foreground">No results.</p>}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>
                  {selectable && (
                    <TableCell className="w-10">
                      <Checkbox
                        aria-label={
                          getRowLabel
                            ? `Select ${getRowLabel(row.original)}`
                            : `Select row ${row.id}`
                        }
                        checked={row.getIsSelected()}
                        onCheckedChange={(checked) => row.toggleSelected(Boolean(checked))}
                      />
                    </TableCell>
                  )}
                  {row.getAllCells().map((cell) => {
                    const meta = cell.column.columnDef.meta as DataTableColumnMeta | undefined
                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(meta?.align === "end" && "text-right font-mono")}
                      >
                        <table.FlexRender cell={cell} />
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {loading && (
        <p className="sr-only" role="status">
          Loading…
        </p>
      )}
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      {!loading && data.length > 0 && (
        <TablePagination
          pageIndex={pagination.pageIndex}
          pageSize={pagination.pageSize}
          rowCount={data.length}
          onPageIndexChange={(pageIndex) => setPagination((p) => ({ ...p, pageIndex }))}
          onPageSizeChange={(pageSize) => setPagination({ pageIndex: 0, pageSize })}
          {...(pageSizeOptions ? { pageSizeOptions } : {})}
          {...(itemLabel ? { itemLabel } : {})}
          aria-label={`${label} pagination`}
        />
      )}
    </div>
  )
}

export { DataTable }
