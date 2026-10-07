import { expect, test, type Page } from "@playwright/test"

import { expectNoAxeViolations, open, THEMES } from "./helpers"

const nav = (page: Page) => page.getByRole("navigation", { name: "Documentation" })

test.describe("docs site", () => {
  test("home: the docs README, every page in the navigation, the current one marked", async ({
    page,
  }) => {
    await open(page, "/docs")
    await expect(
      page.getByRole("heading", { level: 1, name: "Rentino panel — documentation" })
    ).toBeVisible()
    await expect(
      nav(page).getByRole("link", { name: "Rentino panel — documentation" })
    ).toHaveAttribute("aria-current", "page")
    for (const name of [
      "Mock data and states",
      "Setup 3 — Equipment and prices",
      "Backend guidelines",
    ])
      await expect(nav(page).getByRole("link", { name })).toBeVisible()
    // The screen template is for authors, not a page to browse.
    await expect(nav(page).getByRole("link", { name: "Screen name" })).toHaveCount(0)
  })

  test("links between docs stay on the site; files outside docs/ open on GitHub", async ({
    page,
  }) => {
    await open(page, "/docs")
    await page.getByRole("main").getByRole("link", { name: "Mock data and states" }).click()
    await expect(page).toHaveURL(/\/docs\/mock-data$/)
    await expect(
      page.getByRole("heading", { level: 1, name: "Mock data and states" })
    ).toBeVisible()

    await open(page, "/docs")
    const claude = page.getByRole("main").getByRole("link", { name: /^CLAUDE\.md/ })
    await expect(claude).toHaveAttribute(
      "href",
      "https://github.com/ProductPope/rentino-panel/blob/main/CLAUDE.md"
    )
    await expect(claude).toHaveAttribute("target", "_blank")
    await expect(claude).toHaveAccessibleName("CLAUDE.md (opens in a new tab)")
  })

  test("screenshots load; headings have anchors", async ({ page }) => {
    await open(page, "/docs/screens/setup-3-equipment")
    const shot = page.getByRole("img", { name: "Setup step 3" })
    await expect(shot).toHaveAttribute("src", "/docs/img/setup-3-equipment.jpg")
    await expect(shot).toHaveJSProperty("complete", true)
    expect(await shot.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0)
    await expect(page.locator("h2#the-side-panel-editpanel")).toBeVisible()
  })

  test("an unknown page is a 404", async ({ page }) => {
    const response = await page.goto("/docs/no-such-page")
    expect(response?.status()).toBe(404)
  })

  for (const theme of THEMES)
    test(`axe on a page with code blocks — ${theme}`, async ({ page }) => {
      await open(page, "/docs/getting-started", theme)
      await expect(page.getByRole("group", { name: "Code" }).first()).toBeVisible()
      await expectNoAxeViolations(page)
    })
})
