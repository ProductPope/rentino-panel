/**
 * The docs navigation. Guides and Backend list their folder; Screens mirrors the panel's own
 * navigation (`NAVIGATION`): the same items in the same order, each linked to the screen doc whose
 * `routes` include the item's href, with sections that aren't built shown as "Soon". Pages nest by
 * folder (screens/welcome/setup/… under Welcome), ordered as their folder's README links them.
 */

export interface NavPage {
  /** Relative to docs/, e.g. "screens/welcome/README.md". */
  file: string
  href: string
  title: string
  /** Short label for the navigation (front matter `nav`). */
  nav?: string
  routes: string[]
  /** Docs files the page links to, in order (orders a README's folder). */
  links: string[]
}

export interface NavNode<Icon = unknown> {
  label: string
  /** Absent for sections that have no doc yet. */
  href?: string
  icon?: Icon
  soon?: boolean
  children: NavNode<Icon>[]
}

export interface PanelNavItem<Icon = unknown> {
  label: string
  href: string
  icon?: Icon
  comingSoon?: boolean
  children?: PanelNavItem<Icon>[]
}

const dirOf = (file: string) => file.split("/").slice(0, -1).join("/")
const isIndex = (file: string) => file === "README.md" || file.endsWith("/README.md")
const isTemplate = (file: string) => (file.split("/").pop() ?? "").startsWith("_")

/** Pages directly inside a folder: its files, and the READMEs of its subfolders. */
function childrenOf(pages: NavPage[], index: NavPage) {
  const dir = dirOf(index.file)
  const prefix = dir ? `${dir}/` : ""
  const inside = pages.filter((p) => {
    if (p === index || isTemplate(p.file) || !p.file.startsWith(prefix)) return false
    const rest = p.file.slice(prefix.length).split("/")
    return rest.length === 1 ? !isIndex(p.file) : rest.length === 2 && rest[1] === "README.md"
  })
  const rank = (p: NavPage) => {
    const at = index.links.indexOf(p.file)
    return at === -1 ? Number.MAX_SAFE_INTEGER : at
  }
  return inside.sort((a, b) => rank(a) - rank(b) || a.title.localeCompare(b.title))
}

const labelOf = (page: NavPage) => page.nav ?? page.title

/** A page and, when it is a folder's README, its folder below it. */
export function treeOf<Icon>(
  pages: NavPage[],
  page: NavPage,
  label = labelOf(page)
): NavNode<Icon> {
  return {
    label,
    href: page.href,
    children: isIndex(page.file)
      ? childrenOf(pages, page).map((child) => treeOf<Icon>(pages, child))
      : [],
  }
}

/** A top-level folder (screens/, backend/) or the docs root: its index as "Overview", then its pages. */
export function folderNav<Icon>(pages: NavPage[], indexFile: string): NavNode<Icon>[] {
  const index = pages.find((p) => p.file === indexFile)
  if (!index) return []
  const overview: NavNode<Icon> = { label: "Overview", href: index.href, children: [] }
  const dir = dirOf(indexFile)
  return [
    overview,
    ...childrenOf(pages, index)
      // The root lists guides only; folders get their own group.
      .filter((p) => dir !== "" || !isIndex(p.file))
      .map((p) => treeOf<Icon>(pages, p)),
  ]
}

/**
 * Screens, as the panel shows them: the overview and the shell, then every panel navigation item
 * (linked to its doc, or "Soon"), then the screen docs outside the panel navigation.
 */
export function screensNav<Icon>(
  pages: NavPage[],
  panel: PanelNavItem<Icon>[],
  indexFile = "screens/README.md"
): NavNode<Icon>[] {
  const [overview, ...rest] = folderNav<Icon>(pages, indexFile)
  const used = new Set<string>()
  const docFor = (href: string) =>
    pages.find((p) => p.file.startsWith("screens/") && p.routes.includes(href))

  const fromPanel = (item: PanelNavItem<Icon>): NavNode<Icon> => {
    const page = docFor(item.href)
    if (page) used.add(page.href)
    const node: NavNode<Icon> = page
      ? treeOf<Icon>(pages, page, item.label)
      : { label: item.label, soon: item.comingSoon ?? true, children: [] }
    if (item.children) node.children = item.children.map(fromPanel)
    node.icon = item.icon
    return node
  }

  const mirrored = panel.map(fromPanel)
  const mark = (nodes: NavNode<Icon>[]): void =>
    nodes.forEach((n) => {
      if (n.href) used.add(n.href)
      mark(n.children)
    })
  mark(mirrored)
  const others = rest.filter((n) => !n.href || !used.has(n.href))
  const [shell, ...outside] = others
  return [...(overview ? [overview] : []), ...(shell ? [shell] : []), ...mirrored, ...outside]
}
