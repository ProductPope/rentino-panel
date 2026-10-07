import { expect, test, type Page } from "@playwright/test"

import { expectNoAxeViolations, open, THEMES } from "./helpers"

const bar = (page: Page) => page.getByRole("region", { name: "Free trial" })
const dialog = (page: Page) => page.getByRole("dialog", { name: "Choose a plan" })
const plan = (page: Page, name: string) =>
  dialog(page).getByRole("group", { name: new RegExp(`^${name}`) })

async function openPlans(page: Page) {
  await bar(page).getByRole("button", { name: "Upgrade to Premium" }).click()
  await expect(dialog(page)).toBeVisible()
}

test.describe("trial bar", () => {
  test("days left of 30 and the end date", async ({ page }) => {
    await open(page, "/welcome")
    await expect(bar(page)).toContainText("Trial days left — 21 / 30")
    await expect(bar(page)).toContainText(/Your trial ends on \w+ \d+, \d{4}/)
  })

  test("a few days left, and an ended trial", async ({ page }) => {
    await open(page, "/welcome?mock=trial-ending")
    await expect(bar(page)).toContainText("3 / 30")
    await open(page, "/welcome?mock=trial-ended")
    await expect(bar(page)).toContainText("0 / 30")
    await expect(bar(page)).toContainText("Your free trial has ended.")
  })
})

test.describe("choose a plan", () => {
  test("four plans, annual by default; monthly shows full prices", async ({ page }) => {
    await open(page, "/welcome")
    await openPlans(page)
    await expect(
      dialog(page).getByRole("list", { name: "Plans" }).getByRole("listitem")
    ).toHaveCount(4)
    await expect(plan(page, "Plan B")).toContainText("Most popular")
    await expect(plan(page, "Plan B")).toContainText("$79 / month")
    await expect(plan(page, "Plan B")).toContainText("$948 billed yearly")
    await expect(plan(page, "Plan C")).toContainText("Branches3")
    await expect(plan(page, "Unlimited")).toContainText("Ask for a price")
    await dialog(page).getByRole("button", { name: "Monthly" }).click()
    await expect(plan(page, "Plan B")).toContainText("$99 / month")
    await expect(plan(page, "Plan B")).toContainText("Billed monthly")
  })

  test("choosing a plan hides the trial bar, also after a reload", async ({ page }) => {
    await open(page, "/welcome")
    await openPlans(page)
    await plan(page, "Plan B").getByRole("button", { name: "Choose Plan B" }).click()
    await expect(dialog(page)).toBeHidden()
    await expect(page.getByText("You're on Plan B")).toBeVisible()
    await expect(bar(page)).toHaveCount(0)
    await page.reload()
    await expect(page.getByRole("heading", { level: 1, name: "Welcome to Rentino" })).toBeVisible()
    await expect(bar(page)).toHaveCount(0)
  })

  test("Unlimited: contact us", async ({ page }) => {
    await open(page, "/welcome")
    await openPlans(page)
    await plan(page, "Unlimited").getByRole("button", { name: "Contact us" }).click()
    await expect(page.getByText("Thanks — we'll be in touch")).toBeVisible()
    await expect(bar(page)).toBeVisible()
  })

  test("Escape closes the dialog and focus returns to the button", async ({ page }) => {
    await open(page, "/welcome")
    await openPlans(page)
    await page.keyboard.press("Escape")
    await expect(dialog(page)).toBeHidden()
    await expect(bar(page).getByRole("button", { name: "Upgrade to Premium" })).toBeFocused()
  })

  for (const theme of THEMES)
    test(`axe on the open dialog — ${theme}`, async ({ page }) => {
      await open(page, "/welcome", theme)
      await openPlans(page)
      await expectNoAxeViolations(page)
    })
})
