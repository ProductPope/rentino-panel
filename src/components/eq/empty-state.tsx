import type * as React from "react"

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "@/components/ui/empty"
import { cn } from "@/lib/utils"

export interface EmptyStateOwnProps {
  /** A lucide icon element. Decorative. */
  icon?: React.ReactNode
  /** What is empty, in plain words: "No discount codes yet". */
  title: React.ReactNode
  /** Why it is empty and what to do next. */
  description?: React.ReactNode
  /** The next step — usually one Button. */
  action?: React.ReactNode
  /** Heading level of the title within the page outline. @defaultValue 2 */
  headingLevel?: 2 | 3 | 4
}

export type EmptyStateProps = EmptyStateOwnProps &
  Omit<React.ComponentProps<"div">, keyof EmptyStateOwnProps>

/** Empty, no-results and first-run states. Always says what to do next. */
function EmptyState({
  icon,
  title,
  description,
  action,
  headingLevel = 2,
  className,
  ...props
}: EmptyStateProps) {
  const Heading = `h${headingLevel}` as const
  return (
    <Empty
      data-slot="empty-state"
      className={cn("border border-dashed border-border", className)}
      {...props}
    >
      <EmptyHeader>
        {icon && (
          <EmptyMedia variant="icon" aria-hidden="true">
            {icon}
          </EmptyMedia>
        )}
        <Heading data-slot="empty-title" className="text-section-title text-foreground">
          {title}
        </Heading>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  )
}

export { EmptyState }
