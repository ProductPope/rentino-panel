import Link from "next/link"

import type { DocPage } from "@/lib/docs/content"
import { cn } from "@/lib/utils"

const GROUPS: { title: string; folder: string }[] = [
  { title: "Guides", folder: "" },
  { title: "Screens", folder: "screens" },
  { title: "Backend", folder: "backend" },
]

/** All docs pages by folder (templates, `_*.md`, left out); on narrow screens it follows the article. */
export function DocsNav({ pages, current }: { pages: DocPage[]; current: string }) {
  return (
    <nav aria-label="Documentation" className="flex flex-col gap-5 lg:order-1">
      {GROUPS.map((group) => {
        const items = pages.filter(
          (p) =>
            !p.file.split("/").pop()?.startsWith("_") &&
            (group.folder ? p.slug[0] === group.folder : p.slug.length <= 1 && !isFolder(pages, p))
        )
        return (
          <div key={group.title} className="flex flex-col gap-1.5">
            <p className="text-caption font-medium tracking-wide text-muted-foreground uppercase">
              {group.title}
            </p>
            <ul className="flex flex-col">
              {items.map((p) => (
                <li key={p.href}>
                  <Link
                    href={p.href}
                    aria-current={p.href === current ? "page" : undefined}
                    className={cn(
                      "block rounded-md px-2 py-1.5 text-body text-foreground-secondary outline-none hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid",
                      "aria-[current=page]:bg-primary-subtle aria-[current=page]:font-medium aria-[current=page]:text-primary-text"
                    )}
                  >
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </nav>
  )
}

/** A folder's index ("screens") is listed in its own group, not under Guides. */
const isFolder = (pages: DocPage[], page: DocPage) =>
  page.slug.length === 1 && pages.some((p) => p.slug.length > 1 && p.slug[0] === page.slug[0])
