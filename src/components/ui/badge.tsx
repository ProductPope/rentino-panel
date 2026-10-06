import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex min-h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary-hover",
        secondary: "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive-subtle text-destructive-text [a]:hover:bg-destructive-subtle-hover",
        success: "bg-success-subtle text-success-text [a]:hover:bg-success/20",
        warning: "bg-warning-subtle text-warning-text [a]:hover:bg-warning/25",
        info: "bg-info-subtle text-info-text [a]:hover:bg-info/20",
        outline: "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost: "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary-text underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeOwnProps {
  /**
   * Tone. Status badges use the role tones: `success`, `info`, `warning`, `destructive`;
   * `secondary`/`outline` for neutral states. Always pair the colour with a text label.
   */
  variant?: VariantProps<typeof badgeVariants>["variant"]
  /** Render as another element, e.g. `render={<a href="…" />}` for a linked badge. */
  render?: useRender.ComponentProps<"span">["render"]
}

export type BadgeProps = BadgeOwnProps & Omit<useRender.ComponentProps<"span">, keyof BadgeOwnProps>

function Badge({ className, variant = "default", render, ...props }: BadgeProps) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
