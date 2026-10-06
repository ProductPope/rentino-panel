import { expect, test } from "@playwright/test"

import { expectNoAxeViolations, open, THEMES } from "./helpers"

const SOURCES = "/welcome/setup/sources"
const PROGRESS = "/welcome/setup/progress"

test.describe("step 1 — your details", () => {
  test("shows the step, both sources and the website field", async ({ page }) => {
    await open(page, SOURCES)
    await expect(page.getByText("Step 1 of 5 · Your details")).toBeVisible()
    await expect(
      page.getByRole("heading", { level: 1, name: "We'll set up your system for you" })
    ).toBeVisible()
    const group = page.getByRole("radiogroup")
    await expect(group.getByRole("radio")).toHaveCount(2)
    await expect(page.getByRole("radio", { name: /Website address/ })).toBeChecked()
    await expect(page.getByRole("textbox", { name: "Your website" })).toBeVisible()
  })

  test("an empty source is an error at the field, and focus goes there", async ({ page }) => {
    await open(page, SOURCES)
    await page.getByRole("button", { name: "Set up my system" }).click()
    const website = page.getByRole("textbox", { name: "Your website" })
    await expect(website).toBeFocused()
    await expect(website).toHaveAttribute("aria-invalid", "true")
    await expect(page.getByText("Enter your website address.")).toBeVisible()
    await expect(page).toHaveURL(new RegExp(`${SOURCES}$`))
  })

  test("a price list file: choose, see it, remove it", async ({ page }) => {
    await open(page, SOURCES)
    await page.getByRole("radio", { name: /Price list file/ }).check()
    await page.getByRole("button", { name: "Set up my system" }).click()
    await expect(page.getByText("Add your price list file.")).toBeVisible()
    await page.getByLabel("Your price list").setInputFiles({
      name: "price-list-2026.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.alloc(240 * 1024),
    })
    await expect(page.getByText("price-list-2026.pdf")).toBeVisible()
    await expect(page.getByText("240 KB")).toBeVisible()
    await page.getByRole("button", { name: "Remove file" }).click()
    await expect(page.getByLabel("Your price list")).toBeVisible()
  })

  test("closing goes back to Welcome, still in state A", async ({ page }) => {
    await open(page, SOURCES)
    await page.getByRole("button", { name: "Close setup" }).click()
    await expect(page).toHaveURL(/\/welcome$/)
    await expect(page.getByRole("link", { name: "Send website or price list" })).toBeVisible()
  })

  for (const theme of THEMES)
    test(`axe with a field error and a chosen file — ${theme}`, async ({ page }) => {
      await open(page, SOURCES, theme)
      await page.getByRole("button", { name: "Set up my system" }).click()
      await expect(page.getByText("Enter your website address.")).toBeVisible()
      await expectNoAxeViolations(page)
      await page.getByRole("radio", { name: /Price list file/ }).check()
      await page.getByLabel("Your price list").setInputFiles({
        name: "prices.csv",
        mimeType: "text/csv",
        buffer: Buffer.from("a,b"),
      })
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
  test("send a website → preparing → Welcome B → draft ready → Welcome C", async ({ page }) => {
    test.setTimeout(60_000)
    await open(page, "/welcome")
    await page.getByRole("link", { name: "Send website or price list" }).click()
    await page.getByRole("textbox", { name: "Your website" }).fill("myrentals.com")
    await page.getByRole("button", { name: "Set up my system" }).click()

    await expect(page).toHaveURL(new RegExp(`${PROGRESS}$`))
    await expect(page.getByText(/Sent today at/)).toBeVisible()
    await expect(page.getByRole("list", { name: "Progress" })).toContainText(
      "Read myrentals.com and your price list"
    )

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
