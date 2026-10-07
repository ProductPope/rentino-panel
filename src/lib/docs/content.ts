import "server-only"

import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"

import { hrefOfSlug, parseFrontMatter, slugOfFile, titleOf } from "./paths"

/** The Markdown files in docs/, read at build time (the /docs pages are static). */
const ROOT = join(process.cwd(), "docs")

export interface DocPage {
  /** Path relative to docs/, e.g. "screens/welcome.md". */
  file: string
  slug: string[]
  href: string
  title: string
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return walk(path)
    return name.endsWith(".md") ? [relative(ROOT, path)] : []
  })
}

/** Every page, the docs home first, then guides, then each folder's index and its pages. */
export function listDocs(): DocPage[] {
  return walk(ROOT)
    .map((file) => {
      const slug = slugOfFile(file)
      return { file, slug, href: hrefOfSlug(slug), title: titleOf(file, read(file)) }
    })
    .sort((a, b) => {
      const key = (p: DocPage) =>
        `${p.slug.length > 1 ? p.slug[0] : ""}/${p.file.endsWith("README.md") ? "" : p.file}`
      return key(a).localeCompare(key(b))
    })
}

const read = (file: string) => readFileSync(join(ROOT, file), "utf8")

export function findDoc(slug: string[]) {
  const page = listDocs().find((p) => p.slug.join("/") === slug.join("/"))
  if (!page) return null
  return { ...page, markdown: parseFrontMatter(read(page.file)).body }
}

export const listImages = () =>
  readdirSync(join(ROOT, "img")).filter((name) => /\.(jpe?g|png|webp|svg)$/.test(name))

export const readImage = (name: string) => readFileSync(join(ROOT, "img", name))
