import { expect, test } from "@playwright/test"

import { expectNoAxeViolations, open, PAGES, THEMES } from "./helpers"

for (const theme of THEMES) {
  test.describe(`axe (WCAG 2.2 A/AA) — ${theme}`, () => {
    for (const { name, path } of PAGES) {
      test(name, async ({ page }) => {
        await open(page, path, theme)
        await expectNoAxeViolations(page)
      })
    }

    test("account menu open", async ({ page }) => {
      await open(page, "/settings/discount-codes", theme)
      await page.getByRole("button", { name: /Anna Nowak/ }).click()
      await expect(page.getByRole("menu")).toBeVisible()
      await expectNoAxeViolations(page)
    })

    test("sidebar collapsed", async ({ page }) => {
      await open(page, "/settings/discount-codes", theme)
      await page.getByRole("button", { name: "Collapse sidebar" }).click()
      await expect(page.getByRole("button", { name: "Expand sidebar" })).toBeVisible()
      await expectNoAxeViolations(page)
    })

    test("mobile navigation sheet open", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 740 })
      await open(page, "/settings/discount-codes", theme)
      await page.getByRole("button", { name: "Open navigation" }).click()
      await expect(page.getByRole("dialog")).toBeVisible()
      await expectNoAxeViolations(page)
    })
  })
}
