import { expect, test, type Page } from "@playwright/test"

import { open } from "./helpers"

const URL = "/welcome/setup/start?mock=imported-settings"

const summary = (page: Page) => page.getByRole("region", { name: "What we set up for you" })
const preview = (page: Page) => page.getByRole("region", { name: "Preview of your booking page" })

/** Add one item by hand and approve it, so the preview has the customer's own equipment. */
async function approveOwnItem(page: Page) {
  await open(page, "/welcome/setup/equipment")
  await page.getByRole("button", { name: "Add equipment" }).first().click()
  const panel = page.getByRole("dialog")
  await panel.getByRole("textbox", { name: "Name" }).fill("City bike")
  await panel.getByRole("combobox", { name: "Parent category" }).click()
  await page.getByRole("option", { name: "Bikes", exact: true }).click()
  await panel.getByRole("textbox", { name: "Number of units" }).fill("14")
  await panel.getByRole("textbox", { name: "Price per day" }).fill("18")
  await panel.getByRole("button", { name: "Add equipment" }).click()
  await expect(panel).toBeHidden()
  await page.getByRole("button", { name: "Approve" }).click()
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Approve and replace demo" })
    .click()
  await expect(page).toHaveURL(/\/welcome\/setup\/settings$/)
}

test.describe("step 5 — start", () => {
  test("preview, address and what we set up — each with a way to edit", async ({ page }) => {
    await open(page, URL)
    await expect(page.getByText("Step 5 of 5 · Start")).toBeVisible()
    await expect(
      page.getByRole("heading", { level: 1, name: "Your booking page is ready" })
    ).toBeVisible()
    await expect(preview(page)).toContainText("bikesmallorca.rentino.app")
    await expect(preview(page)).toContainText("Bikes Mallorca")
    const rows = summary(page).getByRole("listitem")
    await expect(rows).toHaveCount(5)
    await expect(rows.nth(1)).toContainText("20% deposit, the rest 2 days before pickup")
    await expect(rows.nth(3)).toContainText("VAT 21%")
    await summary(page)
      .getByRole("link", { name: /^Edit: 20% deposit/ })
      .click()
    await expect(page).toHaveURL(/\/welcome\/setup\/settings$/)
  })

  test("the preview shows the customer's own equipment and prices", async ({ page }) => {
    await approveOwnItem(page)
    await page.getByRole("checkbox", { name: /I confirm my rentals/ }).check()
    await page.getByRole("button", { name: "Save and continue" }).click()
    await expect(page).toHaveURL(/\/welcome\/setup\/start$/)
    const list = preview(page).getByRole("list", { name: "Equipment on your booking page" })
    await expect(list.getByRole("listitem")).toHaveCount(1)
    await expect(list).toContainText("City bike")
    await expect(list).toContainText("from $18.00 / day")
    await expect(summary(page).getByRole("listitem").first()).toContainText("1 item · 14 units")
  })

  test("Connect with Stripe connects payments; Welcome drops the step", async ({ page }) => {
    await open(page, URL)
    await page.getByRole("button", { name: "Connect with Stripe" }).click()
    await expect(page).toHaveURL(/\/welcome$/)
    await expect(page.getByText("Payments connected")).toBeVisible()
    await expect(page.getByRole("list", { name: "Next steps" })).not.toContainText(
      "Connect a payment account"
    )
  })

  test("not yet: back to Welcome, where Connect leads here again", async ({ page }) => {
    await open(page, URL)
    await page.getByRole("button", { name: "Not yet — share a preview link" }).click()
    await expect(page).toHaveURL(/\/welcome$/)
    await expect(page.getByText(/Preview link|Your preview link/)).toBeVisible()
    await page.goto("/welcome?mock=imported-settings")
    await page.getByRole("link", { name: "Connect" }).click()
    await expect(page).toHaveURL(/\/welcome\/setup\/start$/)
  })

  test("already connected: says so instead of asking again", async ({ page }) => {
    await open(page, "/welcome/setup/start?mock=imported-paid")
    await expect(page.getByRole("heading", { name: "Payments are connected" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Connect with Stripe" })).toHaveCount(0)
  })

  test("before the equipment is approved, it points back to step 1", async ({ page }) => {
    await open(page, "/welcome/setup/start")
    await expect(page.getByText("Add your equipment first")).toBeVisible()
  })

  test("Open page opens the booking page in a new tab and says so", async ({ page }) => {
    await open(page, URL)
    const link = preview(page).getByRole("link", { name: /Open page/ })
    await expect(link).toHaveAccessibleName(/opens in a new tab/)
    await expect(link).toHaveAttribute("target", "_blank")
  })
})
