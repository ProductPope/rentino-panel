import { expect, test, type Page } from "@playwright/test"

import { expectNoAxeViolations, open, THEMES } from "./helpers"

const SOURCES = "/welcome/setup/sources"
const PROGRESS = "/welcome/setup/progress"

const choosePriceList = async (page: Page) =>
  page.getByRole("radio", { name: /Upload a price list/ }).check()

const attach = (page: Page, name = "price-list-2026.pdf", size = 240 * 1024) =>
  page.getByLabel("Your price list").setInputFiles({
    name,
    mimeType: "application/pdf",
    buffer: Buffer.alloc(size),
  })

test.describe("step 1 — add your equipment", () => {
  test("offers entering by hand (default) or uploading a price list", async ({ page }) => {
    await open(page, SOURCES)
    await expect(page.getByText("Step 1 of 5 · Your details")).toBeVisible()
    await expect(page.getByRole("heading", { level: 1, name: "Add your equipment" })).toBeVisible()
    await expect(page.getByRole("radiogroup").getByRole("radio")).toHaveCount(2)
    await expect(page.getByRole("radio", { name: /Enter it by hand/ })).toBeChecked()
    await expect(page.getByRole("radio", { name: /website/i })).toHaveCount(0)
  })

  test("by hand goes straight to the equipment list", async ({ page }) => {
    await open(page, SOURCES)
    await page.getByRole("button", { name: "Continue" }).click()
    await expect(page).toHaveURL(/\/welcome\/setup\/equipment$/)
    await expect(page.getByText("Step 3 of 5 · Equipment and prices")).toBeVisible()
  })

  test("a price list needs a file: error at the field, and focus goes there", async ({ page }) => {
    await open(page, SOURCES)
    await choosePriceList(page)
    await page.getByRole("button", { name: "Send the price list" }).click()
    const input = page.getByLabel("Your price list")
    await expect(input).toBeFocused()
    await expect(input).toHaveAttribute("aria-invalid", "true")
    await expect(page.getByText("Add your price list file.")).toBeVisible()
  })

  test("a price list file: choose, see it, remove it", async ({ page }) => {
    await open(page, SOURCES)
    await choosePriceList(page)
    await attach(page)
    await expect(page.getByText("price-list-2026.pdf")).toBeVisible()
    await expect(page.getByText("240 KB")).toBeVisible()
    await page.getByRole("button", { name: "Remove file" }).click()
    await expect(page.getByLabel("Your price list")).toBeVisible()
  })

  test("closing goes back to Welcome, still in state A", async ({ page }) => {
    await open(page, SOURCES)
    await page.getByRole("button", { name: "Close setup" }).click()
    await expect(page).toHaveURL(/\/welcome$/)
    await expect(page.getByRole("link", { name: "Add equipment" })).toBeVisible()
  })

  for (const theme of THEMES)
    test(`axe with a field error and a chosen file — ${theme}`, async ({ page }) => {
      await open(page, SOURCES, theme)
      await choosePriceList(page)
      await page.getByRole("button", { name: "Send the price list" }).click()
      await expect(page.getByText("Add your price list file.")).toBeVisible()
      await expectNoAxeViolations(page)
      await attach(page, "prices.csv", 3)
      await expect(page.getByRole("button", { name: "Remove file" })).toBeVisible()
      await expectNoAxeViolations(page)
    })
})

test.describe("step 2 — preparing", () => {
  test("shows done, in progress and next steps, and the email note", async ({ page }) => {
    await open(page, `${PROGRESS}?mock=processing`)
    await expect(page.getByText("Step 2 of 5 · Preparing")).toBeVisible()
    const rows = page.getByRole("list", { name: "Progress" }).getByRole("listitem")
    await expect(rows).toHaveCount(6)
    await expect(rows.nth(0)).toContainText("Done:")
    await expect(rows.nth(3)).toContainText("In progress: Checking seasonal price lists…")
    await expect(rows.nth(5)).toContainText("Next:")
    await expect(page.getByText("We'll send it to marek@bikesmallorca.com")).toBeVisible()
  })

  test("without anything sent, it goes back to step 1", async ({ page }) => {
    await page.goto(PROGRESS)
    await expect(page).toHaveURL(new RegExp(`${SOURCES}$`))
  })
})

test.describe("clickable flow", () => {
  test("send a price list → preparing → Welcome B → draft ready → Welcome C", async ({ page }) => {
    test.setTimeout(60_000)
    await open(page, "/welcome")
    await page.getByRole("link", { name: "Add equipment" }).click()
    await choosePriceList(page)
    await attach(page, "my-prices.pdf")
    await page.getByRole("button", { name: "Send the price list" }).click()

    await expect(page).toHaveURL(new RegExp(`${PROGRESS}$`))
    await expect(page.getByText(/Sent today at/)).toBeVisible()
    await expect(page.getByRole("list", { name: "Progress" })).toContainText("Read my-prices.pdf")

    await page.getByRole("link", { name: "Go to the panel" }).click()
    await expect(page).toHaveURL(/\/welcome$/)
    await expect(page.getByRole("link", { name: "Show progress" })).toBeVisible()

    // The simulated draft is ready ~15 s after sending; the Welcome card updates by itself.
    await expect(page.getByRole("button", { name: "Review and approve" })).toBeVisible({
      timeout: 25_000,
    })
    await page.reload()
    await expect(page.getByText("Your system is ready to review")).toBeVisible()
  })
})
