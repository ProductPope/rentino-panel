import { expect, test, type Page } from "@playwright/test"

import { expectNoAxeViolations, open, THEMES } from "./helpers"

const nav = (page: Page) => page.getByRole("navigation", { name: "Documentation" })

test.describe("docs site", () => {
  test("home: Guides and Screens; the current page marked", async ({ page }) => {
    await open(page, "/docs")
    await expect(
      page.getByRole("heading", { level: 1, name: "Rentino panel — documentation" })
    ).toBeVisible()
    for (const name of ["Guides", "Screens"])
      await expect(nav(page).getByRole("heading", { name })).toBeVisible()
    // Backend notes live with their features, not in a group of their own.
    await expect(nav(page).getByRole("heading", { name: "Backend" })).toHaveCount(0)
    await expect(nav(page).getByRole("link", { name: "Overview" }).first()).toHaveAttribute(
      "aria-current",
      "page"
    )
    await expect(nav(page).getByRole("link", { name: "Mock data", exact: true })).toBeVisible()
    // The screen template is for authors, not a page to browse.
    await expect(nav(page).getByRole("link", { name: "Screen name" })).toHaveCount(0)
  })

  test("Screens mirror the panel navigation, nested, with what isn't built marked Soon", async ({
    page,
  }) => {
    await open(page, "/docs/screens/welcome/setup/equipment")
    const welcome = nav(page)
      .getByRole("listitem")
      .filter({
        has: page.getByRole("link", { name: "Welcome", exact: true }),
      })
    const wizard = welcome.getByRole("listitem").filter({
      has: page.getByRole("link", { name: "Setup wizard" }),
    })
    await expect(wizard.getByRole("link")).toHaveText([
      "Setup wizard",
      "1 · Your details",
      "2 · Preparing",
      "3 · Equipment and prices",
      "4 · Settings",
      "5 · Start",
      "Mock data and states",
      "Backend (suggestion)",
    ])
    await expect(wizard.getByRole("link", { name: "3 · Equipment and prices" })).toHaveAttribute(
      "aria-current",
      "page"
    )
    const settings = nav(page)
      .getByRole("listitem")
      .filter({
        has: page.getByRole("link", { name: "Settings", exact: true }),
      })
    await expect(settings.getByRole("link", { name: "Discount codes" })).toHaveAttribute(
      "href",
      "/docs/screens/settings/discount-codes"
    )
    // A feature's mock data and backend suggestion sit under it.
    const codes = settings.getByRole("listitem").filter({
      has: page.getByRole("link", { name: "Discount codes" }),
    })
    await expect(codes.getByRole("link", { name: "Backend (suggestion)" })).toHaveAttribute(
      "href",
      "/docs/screens/settings/discount-codes/backend"
    )
    // Sections the panel doesn't have yet: plain text, not links.
    await expect(nav(page).getByText("Dashboard")).toBeVisible()
    await expect(nav(page).getByRole("link", { name: "Dashboard" })).toHaveCount(0)
  })

  test("links between docs stay on the site; files outside docs/ open on GitHub", async ({
    page,
  }) => {
    await open(page, "/docs")
    await page.getByRole("main").getByRole("link", { name: "Mock data", exact: true }).click()
    await expect(page).toHaveURL(/\/docs\/mock-data$/)
    await expect(page.getByRole("heading", { level: 1, name: "Mock data" })).toBeVisible()

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
    await open(page, "/docs/screens/welcome/setup/equipment")
    const shot = page.getByRole("img", { name: "Setup step 3" })
    await expect(shot).toHaveAttribute("src", "/docs/img/setup-3-equipment.jpg")
    await expect(shot).toHaveJSProperty("complete", true)
    expect(await shot.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0)
    await expect(page.locator("h2#the-side-panel-editpanel")).toBeVisible()
  })

  test("backend pages say they are a suggestion", async ({ page }) => {
    await open(page, "/docs/screens/welcome/setup/backend")
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Onboarding wizard — backend (suggestion)"
    )
    await expect(page.getByText("This is a suggestion, not a specification.")).toBeVisible()
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
