import AxeBuilder from "@axe-core/playwright"
import { expect, type Page } from "@playwright/test"

/** Every route of the app. Add new pages here: each gets axe, keyboard and reflow checks. */
export const PAGES = [
  { name: "Discount codes", path: "/settings/discount-codes" },
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
