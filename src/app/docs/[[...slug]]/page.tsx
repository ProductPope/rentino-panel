import { ArrowLeftIcon, BookOpenIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { DocsNav } from "@/components/app/docs/docs-nav"
import { Markdown } from "@/components/app/docs/markdown"
import { buttonVariants } from "@/components/ui/button"
import { WELCOME_HREF } from "@/config/navigation"
import { findDoc, listDocs } from "@/lib/docs/content"
import { DOCS_HREF, REPO_URL } from "@/lib/docs/paths"

/** Every docs/ file becomes a static page at build time; nothing else exists under /docs. */
export const dynamicParams = false

export function generateStaticParams() {
  return listDocs().map((page) => ({ slug: page.slug }))
}

type Props = { params: Promise<{ slug?: string[] }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug = [] } = await params
  const page = findDoc(slug)
  return { title: page ? `${page.title} · Docs` : "Docs" }
}

/** The docs/ folder as a site: the same Markdown developers read on GitHub. */
export default async function DocsPage({ params }: Props) {
  const { slug = [] } = await params
  const page = findDoc(slug)
  if (!page) notFound()
  const pages = listDocs()

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-(--eq-page-padding) py-3">
          <Link
            href={DOCS_HREF}
            className="flex items-center gap-2 rounded-sm text-label text-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid"
          >
            <BookOpenIcon aria-hidden="true" className="size-4" />
            Rentino panel docs
          </Link>
          <span className="flex-1" />
          <Link href={WELCOME_HREF} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
            Open the panel
          </Link>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-8 px-(--eq-page-padding) py-8 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <main className="min-w-0 lg:order-2">
          <article className="flex max-w-3xl flex-col gap-4">
            <Markdown file={page.file}>{page.markdown}</Markdown>
            <p className="mt-6 border-t border-border pt-4 text-caption text-muted-foreground">
              Source:{" "}
              <a
                href={`${REPO_URL}/blob/main/docs/${page.file}`}
                target="_blank"
                rel="noopener"
                className="rounded-sm font-mono underline underline-offset-2 outline-none hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid"
              >
                docs/{page.file}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>{" "}
              — edit it there; this page is built from it.
            </p>
          </article>
        </main>
        <DocsNav pages={pages} current={page.href} />
      </div>
    </div>
  )
}
