import "server-only"

import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"

import type { NavPage } from "./nav"
import { hrefOfSlug, linkedFiles, parseFrontMatter, routesOf, slugOfFile, titleOf } from "./paths"

/** The Markdown files in docs/, read at build time (the /docs pages are static). */
const ROOT = join(process.cwd(), "docs")

export interface DocPage extends NavPage {
  slug: string[]
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return walk(path)
    return name.endsWith(".md") ? [relative(ROOT, path)] : []
  })
}

/** Every page in docs/ (the navigation orders them; see nav.ts). */
export function listDocs(): DocPage[] {
  return walk(ROOT)
    .map((file): DocPage => {
      const source = read(file)
      const { data, body } = parseFrontMatter(source)
      const slug = slugOfFile(file)
      return {
        file,
        slug,
        href: hrefOfSlug(slug),
        title: titleOf(file, source),
        nav: data.nav,
        routes: routesOf(data.routes),
        links: linkedFiles(file, body),
      }
    })
    .sort((a, b) => a.file.localeCompare(b.file))
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
