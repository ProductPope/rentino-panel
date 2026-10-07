---
title: Docs site
routes: [/docs/[[...slug]]]
status: prototype
---

# Docs site

These docs, as pages of the prototype: **<https://rentino-panel.vercel.app/docs>**. The site is built
from the same Markdown files in `docs/` that GitHub shows, so there is one source and the site always
matches the prototype version it ships with (every Vercel preview has its own `/docs` too).

## How it works

- `src/app/docs/[[...slug]]/page.tsx` — one static page per `docs/**/*.md`, generated at build time
  (`generateStaticParams`, `dynamicParams = false`: anything else under `/docs` is a 404).
  `docs/README.md` → `/docs`, `docs/screens/README.md` → `/docs/screens`,
  `docs/screens/welcome.md` → `/docs/screens/welcome`.
- `src/app/docs/img/[name]/route.ts` — serves `docs/img/*` at `/docs/img/<name>`.
- `src/lib/docs/paths.ts` — routes and link rewriting (tests: `paths.test.ts`): links to other docs
  stay on the site, images go to `/docs/img`, links to files outside `docs/` (`CLAUDE.md`, source
  files) open on GitHub in a new tab. Headings get GitHub-style anchors, so `#…` links work in both.
- `src/components/app/docs/markdown.tsx` — renders Markdown (`react-markdown` + GFM) with the panel's
  type scale and semantic tokens; `docs-nav.tsx` — the page list (Guides, Screens, Backend; files
  starting with `_` are left out).

## Writing for both GitHub and the site

Write plain GitHub Markdown with relative links (`./mock-data.md`, `../img/x.jpg`) — both work.
Mermaid diagrams render on GitHub; the site shows their source (no diagram renderer, to keep the
bundle small).

## Accessibility

Wide tables and code blocks scroll sideways inside a focusable group, so the page itself never
scrolls at 320 px and keyboard users can scroll them. External links say "(opens in a new tab)".
The current page is marked with `aria-current="page"` in the navigation.

## Tests

`e2e/docs.spec.ts` (navigation, links, images, anchors, 404, axe on code blocks); the docs home (tables)
and a screen page are in `PAGES` (axe, keyboard, reflow, text spacing).
