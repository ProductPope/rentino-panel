/**
 * The docs site (/docs) shows the Markdown files in docs/. These pure functions map file paths to
 * routes and rewrite links, so the same files read well on GitHub and on the site.
 */

export const DOCS_HREF = "/docs"
export const REPO_URL = "https://github.com/ProductPope/rentino-panel"

/** "README.md" → [], "screens/README.md" → ["screens"], "screens/welcome.md" → ["screens", "welcome"]. */
export function slugOfFile(file: string): string[] {
  const parts = file.replace(/\.md$/, "").split("/")
  if (parts.at(-1) === "README") parts.pop()
  return parts
}

export const hrefOfSlug = (slug: string[]) =>
  slug.length === 0 ? DOCS_HREF : `${DOCS_HREF}/${slug.join("/")}`

/** Joins a relative path to the directory of `from` (both relative to docs/); ".." may leave docs/. */
export function resolvePath(from: string, target: string) {
  const parts = from.split("/").slice(0, -1)
  for (const part of target.split("/")) {
    if (part === "" || part === ".") continue
    if (part === "..") {
      if (parts.length > 0 && parts.at(-1) !== "..") parts.pop()
      else parts.push("..")
    } else parts.push(part)
  }
  return parts.join("/")
}

/**
 * Where a link in docs/<from> points on the site:
 * - web links and anchors stay as they are;
 * - another doc → its /docs route (with the anchor);
 * - an image in docs/img → /docs/img/<name>;
 * - anything outside docs/ (CLAUDE.md, source files) → the file on GitHub.
 */
export function rewriteHref(from: string, href: string) {
  if (/^([a-z]+:|#)/i.test(href)) return href
  const [path = "", hash] = href.split("#")
  const target = resolvePath(from, decodeURI(path))
  const anchor = hash ? `#${hash}` : ""
  if (target.startsWith("../")) {
    const repoPath = target.replace(/^\.\.\//, "")
    return `${REPO_URL}/blob/main/${repoPath}${anchor}`
  }
  if (target.startsWith("img/")) return `${DOCS_HREF}/${target}`
  if (target.endsWith(".md")) return `${hrefOfSlug(slugOfFile(target))}${anchor}`
  return `${REPO_URL}/blob/main/docs/${target}${anchor}`
}

/** GitHub-style heading anchors: "Keeping the docs current" → "keeping-the-docs-current". */
export function headingId(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .replace(/\s/g, "-")
}

/** Splits YAML-ish front matter (key: value lines) from the Markdown body. */
export function parseFrontMatter(source: string) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n?/)
  if (!match) return { data: {} as Record<string, string>, body: source }
  const data: Record<string, string> = {}
  for (const line of (match[1] ?? "").split("\n")) {
    const kv = line.match(/^(\w+):\s*(.*?)(?:\s+#.*)?$/)
    if (kv?.[1]) data[kv[1]] = kv[2] ?? ""
  }
  return { data, body: source.slice(match[0].length) }
}

/** The page title: front matter `title`, else the first "# " heading, else the file name. */
export function titleOf(file: string, source: string) {
  const { data, body } = parseFrontMatter(source)
  if (data.title) return data.title
  const heading = body.match(/^# (.+)$/m)?.[1]
  return heading?.trim() ?? file
}
