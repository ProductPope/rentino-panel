import { expect, test, type Page } from "@playwright/test"

import { expectNoAxeViolations, open, THEMES } from "./helpers"

const URL = "/welcome/setup/settings?mock=imported"

const tile = (page: Page, name: string) => page.getByRole("region", { name })
const save = (page: Page) => page.getByRole("button", { name: "Save and continue" }).click()
const vat = (page: Page) =>
  page.getByRole("checkbox", { name: "I confirm my rentals are subject to 21% VAT" })

test.describe("step 4 — settings", () => {
  test("suggested terms: deposit, delivery, signature on; VAT needs confirmation", async ({
    page,
  }) => {
    await open(page, URL)
    await expect(page.getByText("Step 4 of 5 · Settings")).toBeVisible()
    await expect(
      page.getByRole("heading", { level: 1, name: "Your rental settings" })
    ).toBeVisible()
    await expect(page.getByRole("radio", { name: "Deposit, the rest later" })).toBeChecked()
    await expect(page.getByRole("textbox", { name: "Deposit at booking" })).toHaveValue("20")
    await expect(page.getByRole("radio", { name: "Yes, we deliver" })).toBeChecked()
    await expect(page.getByRole("textbox", { name: "Flat fee" })).toHaveValue("10")
    await expect(tile(page, "Taxes and fees")).toContainText("Needs confirmation")
    await expect(tile(page, "Taxes and fees")).toContainText("21% · Spain")
    await expect(page.getByRole("switch", { name: "Customer signature at booking" })).toBeChecked()
  })

  test("choices show and hide their fields", async ({ page }) => {
    await open(page, URL)
    await page.getByRole("radio", { name: "Full payment online" }).check()
    await expect(page.getByRole("textbox", { name: "Deposit at booking" })).toHaveCount(0)
    await page.getByRole("radio", { name: "No, pickup only" }).check()
    await expect(page.getByRole("textbox", { name: "Flat fee" })).toHaveCount(0)
    await page.getByRole("button", { name: "Add a fee" }).click()
    await expect(page.getByRole("textbox", { name: "Card payment fee" })).toBeVisible()
    await page.getByRole("button", { name: "Remove the fee" }).click()
    await expect(page.getByRole("textbox", { name: "Card payment fee" })).toHaveCount(0)
  })

  test("saving without VAT confirmed: error at the checkbox, focus there", async ({ page }) => {
    await open(page, URL)
    await save(page)
    await expect(vat(page)).toBeFocused()
    await expect(vat(page)).toHaveAttribute("aria-invalid", "true")
    await expect(page.getByText("Confirm the VAT rate to continue.")).toBeVisible()
    await expect(page).toHaveURL(/\/welcome\/setup\/settings/)
  })

  test("wrong numbers are errors at their fields", async ({ page }) => {
    await open(page, URL)
    await vat(page).check()
    await page.getByRole("textbox", { name: "Deposit at booking" }).fill("150")
    await save(page)
    const deposit = page.getByRole("textbox", { name: "Deposit at booking" })
    await expect(deposit).toBeFocused()
    await expect(deposit).toHaveAttribute("aria-invalid", "true")
    await expect(page.getByText("Enter a whole number from 1 to 99.")).toBeVisible()
  })

  test("confirming VAT and saving leads to step 5 and finishes the settings", async ({ page }) => {
    await open(page, URL)
    await vat(page).check()
    await expect(tile(page, "Taxes and fees")).toContainText("Confirmed")
    await page.getByRole("radio", { name: "No, pickup only" }).check()
    await save(page)
    await expect(page).toHaveURL(/\/welcome\/setup\/start$/)
    await expect(page.getByText("Step 5 of 5 · Start")).toBeVisible()
    await page.goto("/welcome")
    await expect(
      page.getByRole("heading", {
        name: "Your equipment, price lists and rental terms are in the system",
      })
    ).toBeVisible()
    await expect(page.getByText(/20% deposit · pickup only/)).toBeVisible()
    await expect(page.getByRole("list", { name: "Next steps" })).not.toContainText(
      "Finish your rental settings"
    )
  })

  test("before the equipment is approved, it points back to step 1", async ({ page }) => {
    await open(page, "/welcome/setup/settings")
    await expect(page.getByText("Add your equipment first")).toBeVisible()
    await page.getByRole("link", { name: "Add equipment" }).click()
    await expect(page).toHaveURL(/\/welcome\/setup\/sources$/)
  })

  test("Welcome D: Finish opens the settings", async ({ page }) => {
    await open(page, "/welcome?mock=imported")
    await page.getByRole("link", { name: "Finish" }).click()
    await expect(page).toHaveURL(/\/welcome\/setup\/settings$/)
  })

  for (const theme of THEMES)
    test(`axe with every field shown and errors — ${theme}`, async ({ page }) => {
      await open(page, URL, theme)
      await page.getByRole("button", { name: "Add a fee" }).click()
      await page.getByRole("textbox", { name: "Deposit at booking" }).fill("0")
      await save(page)
      await expect(page.getByText("Confirm the VAT rate to continue.")).toBeVisible()
      await expectNoAxeViolations(page)
    })
})
