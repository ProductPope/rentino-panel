// Fails when app code uses colours outside the EQ semantic tokens: Tailwind palette classes
// (bg-blue-500, text-gray-700, …), hex values, or rgb()/hsl()/oklch() literals.
// The EQ registry theme does not remove Tailwind's palette in apps yet, so this guards it here.
// Registry output (components/ui, components/eq, hooks, lib/utils.ts, globals.css) is not scanned:
// it comes from EQ-librium unchanged.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"

const ROOT = join(import.meta.dirname, "..")
const SCAN = ["src", "e2e"]
const SKIP = [
  "src/components/ui",
  "src/components/eq",
  "src/hooks",
  "src/lib/utils.ts",
  "src/app/globals.css",
]
const EXTENSIONS = /\.(tsx?|mts|css)$/

const PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose"
const RULES = [
  {
    name: "Tailwind palette class",
    pattern: new RegExp(`\\b[a-z-]+-(?:${PALETTE})-\\d{2,3}\\b`, "g"),
  },
  { name: "hex colour", pattern: /#[0-9a-fA-F]{3,8}\b/g },
  { name: "colour function", pattern: /\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\(/g },
]

function* files(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    const rel = relative(ROOT, path)
    if (SKIP.some((s) => rel === s || rel.startsWith(`${s}/`))) continue
    if (statSync(path).isDirectory()) yield* files(path)
    else if (EXTENSIONS.test(entry)) yield path
  }
}

const problems = []
for (const dir of SCAN) {
  if (!existsSync(join(ROOT, dir))) continue
  for (const file of files(join(ROOT, dir))) {
    readFileSync(file, "utf8")
      .split("\n")
      .forEach((line, i) => {
        for (const { name, pattern } of RULES) {
          for (const match of line.matchAll(pattern)) {
            problems.push(`${relative(ROOT, file)}:${i + 1}  ${name}: ${match[0]}`)
          }
        }
      })
  }
}

if (problems.length) {
  console.error(
    `Only EQ semantic tokens are allowed (bg-primary, text-muted-foreground, …):\n\n${problems.join("\n")}\n`
  )
  process.exit(1)
}
console.log("check-tokens: only semantic tokens used")
