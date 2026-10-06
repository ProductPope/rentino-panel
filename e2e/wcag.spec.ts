import { expect, test } from "@playwright/test"

import { open, PAGES } from "./helpers"

/** WCAG 2.2 AA checks axe cannot make on a static page. */
for (const { name, path } of PAGES) {
  test.describe(name, () => {
    test("1.4.10 reflow — no horizontal page scroll at 320 CSS px", async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 })
      await open(page, path)
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))
      expect(scrollWidth, "page is wider than the viewport").toBeLessThanOrEqual(clientWidth)
    })

    test("1.4.12 text spacing — WCAG spacing does not clip text", async ({ page }) => {
      await open(page, path)
      await page.addStyleTag({
        content: `* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }
                  p { margin-bottom: 2em !important; }`,
      })
      const clipped = await page.evaluate(() => {
        const out: string[] = []
        for (const el of document.body.querySelectorAll<HTMLElement>("*")) {
          const s = getComputedStyle(el)
          const hides =
            ["hidden", "clip"].includes(s.overflowX) || ["hidden", "clip"].includes(s.overflowY)
          if (!hides || s.textOverflow === "ellipsis") continue
          // visually hidden text for screen readers (sr-only) is clipped on purpose
          if (el.clientWidth <= 1 || el.clientHeight <= 1) continue
          const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent?.trim())
          if (!hasText) continue
          if (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1) {
            out.push(`${el.tagName.toLowerCase()} "${el.textContent?.trim().slice(0, 30)}"`)
          }
        }
        return out
      })
      expect(clipped, "text clipped with WCAG text spacing").toEqual([])
    })

    test("one h1 — the PageHeader title", async ({ page }) => {
      await open(page, path)
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1)
    })
  })
}

test("3.1.1 language of page is set", async ({ page }) => {
  await open(page, "/settings/discount-codes")
  await expect(page.locator("html")).toHaveAttribute("lang", "en")
})

test("2.3.3 reduced motion — EQ durations drop to 0", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await open(page, "/settings/discount-codes")
  const durations = await page.evaluate(() => {
    const s = getComputedStyle(document.documentElement)
    return ["fast", "base", "slow"].map((d) => parseFloat(s.getPropertyValue(`--eq-duration-${d}`)))
  })
  expect(durations).toEqual([0, 0, 0])
})
