import Link from "next/link"
import type { ReactNode } from "react"

import type { AppShellNavSubItem } from "@/components/eq/app-shell"
import { NAVIGATION } from "@/config/navigation"
import type { DocPage } from "@/lib/docs/content"
import { folderNav, screensNav, type NavNode, type PanelNavItem } from "@/lib/docs/nav"
import { cn } from "@/lib/utils"

type PanelItem = AppShellNavSubItem & { children?: AppShellNavSubItem[] }

const toItem = (item: PanelItem): PanelNavItem<ReactNode> => ({
  label: item.label,
  href: item.href,
  icon: item.icon,
  comingSoon: item.comingSoon,
  children: item.children?.map(toItem),
})

const PANEL = NAVIGATION.flatMap((group) => group.items.map(toItem))

/**
 * The docs menu: Guides, and Screens — the panel's own navigation, with sections that aren't built
 * marked "Soon". Each feature's mock data and backend suggestion sit under it. On narrow screens it
 * follows the article.
 */
export function DocsNav({ pages, current }: { pages: DocPage[]; current: string }) {
  const groups: { title: string; nodes: NavNode<ReactNode>[] }[] = [
    { title: "Guides", nodes: folderNav(pages, "README.md") },
    { title: "Screens", nodes: screensNav(pages, PANEL) },
  ]
  return (
    <nav aria-label="Documentation" className="flex flex-col gap-6 lg:order-1">
      {groups.map((group) => (
        <div key={group.title} className="flex flex-col gap-1.5">
          <h2 className="px-2 text-label text-foreground">{group.title}</h2>
          <NavList nodes={group.nodes} current={current} depth={0} />
        </div>
      ))}
    </nav>
  )
}

function NavList({
  nodes,
  current,
  depth,
}: {
  nodes: NavNode<ReactNode>[]
  current: string
  depth: number
}) {
  return (
    <ul className={cn("flex flex-col", depth > 0 && "mt-0.5 ml-3.5 border-l border-border pl-2")}>
      {nodes.map((node) => (
        <li key={`${node.label}-${node.href ?? ""}`}>
          <NavItem node={node} current={current} depth={depth} />
          {node.children.length > 0 && (
            <NavList nodes={node.children} current={current} depth={depth + 1} />
          )}
        </li>
      ))}
    </ul>
  )
}

function NavItem({
  node,
  current,
  depth,
}: {
  node: NavNode<ReactNode>
  current: string
  depth: number
}) {
  const content = (
    <>
      {node.icon && (
        <span aria-hidden="true" className="flex shrink-0 [&_svg]:size-4">
          {node.icon}
        </span>
      )}
      <span className="min-w-0 flex-1">{node.label}</span>
    </>
  )
  const base = cn(
    "flex items-center gap-2 rounded-md px-2 py-1.5",
    depth === 0 ? "text-body" : "text-caption"
  )
  if (!node.href)
    return (
      <span className={cn(base, "text-muted-foreground")}>
        {content}
        <span className="rounded-full border border-border px-1.5 text-caption">Soon</span>
      </span>
    )
  const active = node.href === current
  return (
    <Link
      href={node.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        base,
        "text-foreground-secondary outline-none hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid",
        "aria-[current=page]:bg-primary-subtle aria-[current=page]:font-medium aria-[current=page]:text-primary-text"
      )}
    >
      {content}
    </Link>
  )
}
