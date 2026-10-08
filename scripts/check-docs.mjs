// Fails when docs/ falls behind the code. It checks what can be checked mechanically:
//   1. every route (src/app/**/page.tsx) is listed in the `routes:` of a screen doc (docs/screens/**);
//   2. every page in docs/screens/ is linked from its folder's README (that orders the menu), and every
//      screen doc from docs/screens/README.md;
//   3. every mock scenario (`?mock=…`) and localStorage key (`rentino.mock.…`) in src/mocks is on a
//      feature's mock data page (docs/screens/**/mock-data.md);
//   4. every service interface in src/lib/*/ (…Service, …Repository, AuditLog) and every permission is
//      on a feature's backend page (docs/screens/**/backend.md), and every backend page says it is a
//      suggestion;
//   5. every relative link and image in docs/ and README.md points to a file that exists.
// What it can't check — that the words are still true — is on the PR author (CLAUDE.md, "Docs").
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { dirname, join, relative } from "node:path"

const ROOT = join(import.meta.dirname, "..")
const problems = []
const fail = (message) => problems.push(message)

function files(dir, test) {
  const out = []
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) out.push(...files(path, test))
    else if (test(path)) out.push(path)
  }
  return out
}
const read = (path) => readFileSync(path, "utf8")
const rel = (path) => relative(ROOT, path)

// 1. Routes → screen docs
const APP = join(ROOT, "src/app")
const routes = files(APP, (p) => p.endsWith("/page.tsx")).map((p) => {
  const segments = relative(APP, dirname(p))
    .split("/")
    .filter((s) => s && !/^\(.*\)$/.test(s))
  return "/" + segments.join("/")
})
const SCREENS = join(ROOT, "docs/screens")
const screensPages = files(
  SCREENS,
  (p) => p.endsWith(".md") && p !== join(SCREENS, "README.md") && !p.endsWith("/_template.md")
)
/** A feature's notes next to its screens — not screens themselves. */
const isNote = (p) => /\/(mock-data|backend)\.md$/.test(p)
const screenDocs = screensPages.filter((p) => !isNote(p))
const mockPages = screensPages.filter((p) => p.endsWith("/mock-data.md"))
const backendPages = screensPages.filter((p) => p.endsWith("/backend.md"))
const documented = new Set()
for (const doc of screenDocs) {
  const front = read(doc).match(/^---\n([\s\S]*?)\n---/)
  const line = front?.[1].match(/^routes:\s*\[(.*)\]\s*$/m)
  if (!line) fail(`${rel(doc)}: front matter needs \`routes: [/path, …]\``)
  else for (const r of line[1].split(",")) documented.add(r.trim())
}
for (const route of routes)
  if (!documented.has(route))
    fail(`route ${route} has no screen doc — add docs/screens/<name>.md with routes: [${route}]`)

// 2. Screen docs → their folder's README (it orders the docs menu) and the screens index
const linksTo = (from, doc) =>
  [...read(from).matchAll(/\]\(([^)\s#]+)/g)].some(([, href]) => join(dirname(from), href) === doc)
const screensIndex = join(SCREENS, "README.md")
for (const doc of screensPages) {
  const folder = doc.endsWith("/README.md") ? dirname(dirname(doc)) : dirname(doc)
  const parent = join(folder, "README.md")
  if (!existsSync(parent) || !linksTo(parent, doc))
    fail(
      `${rel(parent)} doesn't link ${relative(folder, doc)} — the folder's README orders the menu`
    )
  if (!isNote(doc) && parent !== screensIndex && !linksTo(screensIndex, doc))
    fail(`docs/screens/README.md doesn't list ${relative(SCREENS, doc)}`)
}

// 3. Mock scenarios and storage keys → the features' mock data pages
const mockSources = files(
  join(ROOT, "src/mocks"),
  (p) => /\.ts$/.test(p) && !p.endsWith(".test.ts")
)
  .map(read)
  .join("\n")
const mockDoc = mockPages.map(read).join("\n")
for (const [, scenario] of mockSources.matchAll(/\?mock=([a-z-]+)/g))
  if (!new RegExp(`\\?mock=${scenario}(?![\\w-])`).test(mockDoc))
    fail(
      `no feature's mock-data.md lists ?mock=${scenario} — add it to docs/screens/<feature>/mock-data.md`
    )
for (const [key] of mockSources.matchAll(/rentino\.mock\.[a-z-]+/g))
  if (!new RegExp(`${key.replaceAll(".", "\\.")}(?![\\w-])`).test(mockDoc))
    fail(`no feature's mock-data.md lists localStorage key ${key}`)

// 4. Service interfaces and permissions → the features' backend pages, each marked a suggestion
const backend = backendPages.map(read).join("\n")
const SUGGESTION = /\*\*This is a suggestion, not a specification\.\*\*/
for (const page of [...backendPages, join(ROOT, "docs/backend.md")])
  if (existsSync(page) && !SUGGESTION.test(read(page)))
    fail(
      `${rel(page)} must open with "**This is a suggestion, not a specification.**" (see others)`
    )
const libSources = files(join(ROOT, "src/lib"), (p) => /\.ts$/.test(p) && !p.endsWith(".test.ts"))
for (const source of libSources)
  for (const [, name] of read(source).matchAll(
    /export interface (\w+(?:Service|Repository)|AuditLog)\b/g
  ))
    if (!backend.includes(`\`${name}\``))
      fail(`no feature's backend.md describes \`${name}\` (${rel(source)})`)
const permissions = read(join(ROOT, "src/lib/session/types.ts")).match(
  /export type Permission\s*=([^\n]+)/
)
for (const [, permission] of permissions?.[1].matchAll(/"([^"]+)"/g) ?? [])
  if (!backend.includes(`\`${permission}\``))
    fail(`no feature's backend.md describes permission \`${permission}\``)

// 5. Links and images
const docs = [
  join(ROOT, "README.md"),
  ...files(join(ROOT, "docs"), (p) => p.endsWith(".md") && !p.endsWith("_template.md")),
]
for (const doc of docs) {
  const text = read(doc).replace(/```[\s\S]*?```/g, "")
  for (const [, target] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    if (/^(https?:|mailto:|#)/.test(target)) continue
    const path = join(dirname(doc), decodeURI(target.split("#")[0]))
    if (!existsSync(path)) fail(`${rel(doc)}: broken link ${target}`)
  }
}

if (problems.length > 0) {
  console.error(
    `check-docs: ${problems.length} problem(s)\n${problems.map((p) => `  - ${p}`).join("\n")}`
  )
  console.error("Docs live in docs/ — see docs/README.md, “Keeping the docs current”.")
  process.exit(1)
}
console.log(
  `check-docs: ${routes.length} routes, ${screenDocs.length} screen docs — in step with the code`
)
