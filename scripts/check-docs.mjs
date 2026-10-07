// Fails when docs/ falls behind the code. It checks what can be checked mechanically:
//   1. every route (src/app/**/page.tsx) is listed in the `routes:` of a screen doc (docs/screens/*.md);
//   2. every screen doc is linked from docs/screens/README.md;
//   3. every mock scenario (`?mock=…`) and localStorage key (`rentino.mock.…`) in src/mocks is in
//      docs/mock-data.md;
//   4. every service interface in src/lib/*/ (…Service, …Repository, AuditLog) and every permission is
//      described in docs/backend/;
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
const screenDocs = files(SCREENS, (p) => p.endsWith(".md") && !/\/(README|_template)\.md$/.test(p))
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

// 2. Screen docs → index
const index = existsSync(join(SCREENS, "README.md")) ? read(join(SCREENS, "README.md")) : ""
for (const doc of screenDocs) {
  const name = relative(SCREENS, doc)
  if (!index.includes(`](./${name})`)) fail(`docs/screens/README.md doesn't link ${name}`)
}

// 3. Mock scenarios and storage keys → mock-data.md
const mockSources = files(
  join(ROOT, "src/mocks"),
  (p) => /\.ts$/.test(p) && !p.endsWith(".test.ts")
)
  .map(read)
  .join("\n")
const mockDoc = existsSync(join(ROOT, "docs/mock-data.md"))
  ? read(join(ROOT, "docs/mock-data.md"))
  : ""
for (const [, scenario] of mockSources.matchAll(/\?mock=([a-z-]+)/g))
  if (!new RegExp(`\\?mock=${scenario}(?![\\w-])`).test(mockDoc))
    fail(`docs/mock-data.md doesn't list ?mock=${scenario}`)
for (const [key] of mockSources.matchAll(/rentino\.mock\.[a-z-]+/g))
  if (!new RegExp(`${key.replaceAll(".", "\\.")}(?![\\w-])`).test(mockDoc))
    fail(`docs/mock-data.md doesn't list localStorage key ${key}`)

// 4. Service interfaces and permissions → backend docs
const backend = files(join(ROOT, "docs/backend"), (p) => p.endsWith(".md"))
  .map(read)
  .join("\n")
const libSources = files(join(ROOT, "src/lib"), (p) => /\.ts$/.test(p) && !p.endsWith(".test.ts"))
for (const source of libSources)
  for (const [, name] of read(source).matchAll(
    /export interface (\w+(?:Service|Repository)|AuditLog)\b/g
  ))
    if (!backend.includes(`\`${name}\``))
      fail(`docs/backend/ doesn't describe \`${name}\` (${rel(source)})`)
const permissions = read(join(ROOT, "src/lib/session/types.ts")).match(
  /export type Permission\s*=([^\n]+)/
)
for (const [, permission] of permissions?.[1].matchAll(/"([^"]+)"/g) ?? [])
  if (!backend.includes(`\`${permission}\``))
    fail(`docs/backend/ doesn't describe permission \`${permission}\``)

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
