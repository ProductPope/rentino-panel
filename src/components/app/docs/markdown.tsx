import { ExternalLinkIcon } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"
import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"

import { headingId, rewriteHref } from "@/lib/docs/paths"
import { cn } from "@/lib/utils"

interface HastNode {
  type: string
  value?: string
  children?: HastNode[]
}

/** The plain text of a heading, for its anchor id. */
const textOf = (node?: HastNode): string =>
  node?.type === "text" ? (node.value ?? "") : (node?.children ?? []).map(textOf).join("")

const focusRing =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid"

function DocLink({ href = "", children }: { href?: string; children: ReactNode }) {
  const className = cn(
    "font-medium text-primary-text underline underline-offset-2 hover:no-underline",
    focusRing,
    "rounded-sm"
  )
  if (/^https?:/.test(href))
    return (
      <a href={href} target="_blank" rel="noopener" className={className}>
        {children}
        <ExternalLinkIcon aria-hidden="true" className="ml-0.5 inline size-3.5 align-baseline" />
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    )
  if (href.startsWith("#"))
    return (
      <a href={href} className={className}>
        {children}
      </a>
    )
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}

/**
 * One docs/ Markdown file, rendered with the panel's type scale and semantic tokens. Links and
 * images are rewritten for the site (`rewriteHref`); wide tables and code scroll on their own.
 */
export function Markdown({ file, children }: { file: string; children: string }) {
  const components: Components = {
    h1: ({ node, children }) => (
      <h1 id={headingId(textOf(node))} className="text-page-title text-foreground">
        {children}
      </h1>
    ),
    h2: ({ node, children }) => (
      <h2
        id={headingId(textOf(node))}
        className="mt-6 scroll-mt-6 border-t border-border pt-6 text-section-title text-foreground"
      >
        {children}
      </h2>
    ),
    h3: ({ node, children }) => (
      <h3 id={headingId(textOf(node))} className="mt-2 scroll-mt-6 text-label text-foreground">
        {children}
      </h3>
    ),
    p: ({ children }) => <p className="text-body text-foreground-secondary">{children}</p>,
    a: ({ href, children }) => <DocLink href={rewriteHref(file, href ?? "")}>{children}</DocLink>,
    ul: ({ children }) => (
      <ul className="flex list-disc flex-col gap-1.5 pl-5 text-body text-foreground-secondary">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-body text-foreground-secondary">
        {children}
      </ol>
    ),
    strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
    blockquote: ({ children }) => (
      <blockquote className="flex flex-col gap-2 rounded-md border-l-4 border-info bg-info-subtle px-4 py-3 [&_p]:text-foreground">
        {children}
      </blockquote>
    ),
    hr: () => <hr className="border-border" />,
    img: ({ src, alt }) => (
      // eslint-disable-next-line @next/next/no-img-element -- static screenshots from docs/img
      <img
        src={typeof src === "string" ? rewriteHref(file, src) : undefined}
        alt={alt ?? ""}
        loading="lazy"
        className="my-1 h-auto max-w-full rounded-lg border border-border"
      />
    ),
    code: ({ className, children }) =>
      className ? (
        <code className={className}>{children}</code>
      ) : (
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.875em] break-words text-foreground">
          {children}
        </code>
      ),
    pre: ({ node, children }) => {
      const code = node?.children?.[0] as { properties?: { className?: string[] } } | undefined
      const mermaid = code?.properties?.className?.includes("language-mermaid")
      return (
        <figure className="flex flex-col gap-1">
          {mermaid && (
            <figcaption className="text-caption text-muted-foreground">
              Diagram (Mermaid source — GitHub draws it)
            </figcaption>
          )}
          <pre
            role="group"
            aria-label={mermaid ? "Diagram source" : "Code"}
            // Scrolls sideways: keyboard users must be able to focus it (WCAG 2.1.1).
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
            className={cn(
              "overflow-x-auto rounded-lg border border-border bg-muted p-4 font-mono text-caption text-foreground",
              focusRing
            )}
          >
            {children}
          </pre>
        </figure>
      )
    },
    table: ({ children }) => (
      <div
        role="group"
        aria-label="Table"
        // Scrolls sideways on narrow screens: keyboard users must be able to focus it (WCAG 2.1.1).
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        className={cn("overflow-x-auto rounded-lg border border-border", focusRing)}
      >
        <table className="w-full border-collapse text-left text-body">{children}</table>
      </div>
    ),
    th: ({ children }) => (
      <th className="border-b border-border bg-muted px-3 py-2 align-top text-label text-foreground">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border-b border-border px-3 py-2 align-top text-foreground-secondary">
        {children}
      </td>
    ),
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
