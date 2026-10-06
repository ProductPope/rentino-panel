import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { ChevronLeftIcon } from "lucide-react"
import type * as React from "react"

import { cn } from "@/lib/utils"

export interface PageHeaderOwnProps {
  /** Page name, rendered as the page's `<h1>`. One size for every page. */
  title: React.ReactNode
  /** Muted meta line under the title — a count or context ("128 total orders"). */
  description?: React.ReactNode
  /** Back link above the title on detail pages — use `<PageHeaderBack>`. */
  back?: React.ReactNode
  /** Status shown beside the title — usually a `<Badge>`. */
  status?: React.ReactNode
  /** Secondary actions (IconButton, outline/secondary Button), rendered before the primary action. */
  actions?: React.ReactNode
  /**
   * The single primary action of the page — a `<Button>` with the default variant.
   * Always rendered last (rightmost). Never pass two.
   */
  primaryAction?: React.ReactNode
  /** Page-level navigation under the title row: `<SectionNav>` or `<TabsList variant="underline">`. */
  nav?: React.ReactNode
}

export type PageHeaderProps = PageHeaderOwnProps &
  Omit<React.ComponentProps<"header">, keyof PageHeaderOwnProps>

/**
 * The one page header. Screens fill slots; absent slots collapse without leaving gaps.
 * Title row: back · title · status · description on the left, actions → primary on the right.
 */
function PageHeader({
  title,
  description,
  back,
  status,
  actions,
  primaryAction,
  nav,
  className,
  ...props
}: PageHeaderProps) {
  const hasActions = actions != null || primaryAction != null
  return (
    <header
      data-slot="page-header"
      className={cn("flex w-full flex-col gap-4", className)}
      {...props}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div data-slot="page-header-titles" className="flex min-w-0 flex-col gap-1">
          {back}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="text-page-title text-foreground">{title}</h1>
            {status}
          </div>
          {description != null && <p className="text-body text-muted-foreground">{description}</p>}
        </div>
        {hasActions && (
          <div data-slot="page-header-actions" className="flex flex-wrap items-center gap-2">
            {actions}
            {primaryAction}
          </div>
        )}
      </div>
      {nav}
    </header>
  )
}

export type PageHeaderBackProps = useRender.ComponentProps<"a">

/**
 * "Back to …" link above a detail page title. Renders an `<a>`;
 * pass `render={<Link href="…" />}` to use your router's link.
 */
function PageHeaderBack({ className, render, children, ...props }: PageHeaderBackProps) {
  return useRender({
    defaultTagName: "a",
    render,
    props: mergeProps<"a">(
      {
        className: cn(
          "mb-1 inline-flex w-fit items-center gap-1 rounded-sm text-caption text-muted-foreground transition-colors duration-(--eq-duration-fast) outline-none hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid [&_svg]:size-3.5",
          className
        ),
        children: (
          <>
            <ChevronLeftIcon aria-hidden="true" />
            {children}
          </>
        ),
      },
      props
    ),
    state: { slot: "page-header-back" },
  })
}

export { PageHeader, PageHeaderBack }
