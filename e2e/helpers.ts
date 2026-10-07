import AxeBuilder from "@axe-core/playwright"
import { expect, type Page } from "@playwright/test"

/** Every route of the app. Add new pages here: each gets axe, keyboard and reflow checks. */
export const PAGES = [
  { name: "Welcome — A, send your details", path: "/welcome" },
  { name: "Welcome — B, preparing", path: "/welcome?mock=processing" },
  { name: "Welcome — B, preparing (long)", path: "/welcome?mock=processing-long" },
  { name: "Welcome — C, draft ready", path: "/welcome?mock=draft-ready" },
  { name: "Welcome — D, imported", path: "/welcome?mock=imported" },
  { name: "Welcome — D, settings and payments done", path: "/welcome?mock=imported-paid" },
  { name: "Welcome — load error", path: "/welcome?mock=error" },
  { name: "Welcome — trial ended", path: "/welcome?mock=trial-ended" },
  { name: "Setup 1 — your details", path: "/welcome/setup/sources" },
  { name: "Setup 3 — equipment by hand", path: "/welcome/setup/equipment" },
  { name: "Setup 4 — settings", path: "/welcome/setup/settings?mock=imported" },
  { name: "Setup 4 — settings before import", path: "/welcome/setup/settings" },
  { name: "Setup 5 — start", path: "/welcome/setup/start?mock=imported-settings" },
  { name: "Setup 5 — start, payments connected", path: "/welcome/setup/start?mock=imported-paid" },
  { name: "Setup 5 — start before import", path: "/welcome/setup/start" },
  { name: "Setup 2 — preparing", path: "/welcome/setup/progress?mock=processing" },
  { name: "Setup 2 — preparing (long)", path: "/welcome/setup/progress?mock=processing-long" },
  { name: "Setup 2 — draft ready", path: "/welcome/setup/progress?mock=draft-ready" },
  { name: "Discount codes", path: "/settings/discount-codes" },
  { name: "Discount codes — empty", path: "/settings/discount-codes?mock=empty" },
  { name: "Discount codes — load error", path: "/settings/discount-codes?mock=error" },
  { name: "Booking page", path: "/booking-page" },
] as const

export const THEMES = ["light", "dark"] as const
export type Theme = (typeof THEMES)[number]

/** WCAG 2.2 A and AA. */
export const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]

/** Open a page in a theme (the app follows the system theme by default) and wait until it settles. */
export async function open(page: Page, path: string, theme: Theme = "light") {
  await page.emulateMedia({ colorScheme: theme })
  await page.goto(path)
  await page.waitForLoadState("networkidle")
  await page.evaluate(() => document.fonts.ready)
  // Data loads client-side from the (mock) repository; wait until no region is busy.
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
  if (theme === "dark") await expect(page.locator("html")).toHaveClass(/\bdark\b/)
  else await expect(page.locator("html")).not.toHaveClass(/\bdark\b/)
}

export async function expectNoAxeViolations(page: Page, include?: string) {
  let builder = new AxeBuilder({ page }).withTags(WCAG_TAGS)
  if (include) builder = builder.include(include)
  // Verified false positive (as in EQ-librium overlays.spec.ts): Base UI focus guards are
  // focusable spans that immediately move focus back into the open popup.
  builder = builder.exclude("[data-base-ui-focus-guard]")
  const { violations } = await builder.analyze()
  expect(
    violations.map(
      (v) => `${v.id}: ${v.help} — ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`
    )
  ).toEqual([])
}

/** The focused element, described for error messages; null when focus is on <body> or gone. */
export async function describeFocus(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null
    if (!el || el === document.body) return null
    const name = el.getAttribute("aria-label") ?? el.textContent?.trim().slice(0, 40) ?? ""
    const role = el.getAttribute("role")
    return `${el.tagName.toLowerCase()}${role ? `[role=${role}]` : ""} "${name}"`
  })
}
