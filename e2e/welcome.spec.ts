import { expect, test, type Page } from "@playwright/test"

import { open } from "./helpers"

const URL = "/welcome"

const steps = (page: Page, list = "Getting started") =>
  page.getByRole("list", { name: list }).getByRole("listitem")

test.describe("navigation", () => {
  test("Welcome is the first menu item and marks itself current", async ({ page }) => {
    await open(page, URL)
    const nav = page.getByRole("navigation").first()
    await expect(nav.getByRole("link").first()).toHaveText("Welcome")
    await expect(nav.getByRole("link", { name: "Welcome" })).toHaveAttribute("aria-current", "page")
  })
})

test.describe("before import (A–C)", () => {
  test("A: send your details first, then two demo steps", async ({ page }) => {
    await open(page, URL)
    await expect(page.getByRole("heading", { level: 1, name: "Welcome to Rentino" })).toBeVisible()
    await expect(page.getByText(/Get started in a few steps/)).toBeVisible()
    await expect(page.getByText("0 of 3 steps done")).toBeAttached()
    await expect(steps(page)).toHaveCount(3)
    await expect(steps(page).nth(0)).toContainText("Send us your details")
    await expect(steps(page).nth(1)).toContainText("Make a test booking")
    await expect(steps(page).nth(1)).toContainText("Demo data")
    await expect(steps(page).nth(2)).toContainText("View your booking page")
  })

  test("B: the first step shows progress with a spinner", async ({ page }) => {
    await open(page, `${URL}?mock=processing`)
    await expect(steps(page).nth(0)).toContainText("We're setting up your system")
    await expect(steps(page).nth(0)).toContainText("Checking seasonal price lists…")
    await expect(steps(page).nth(0).getByRole("status", { name: "In progress" })).toBeVisible()
  })

  test("B, long: says when the draft will be ready", async ({ page }) => {
    await open(page, `${URL}?mock=processing-long`)
    await expect(steps(page).nth(0)).toContainText("by 4:00 PM today at the latest")
  })

  test("C: review the draft", async ({ page }) => {
    await open(page, `${URL}?mock=draft-ready`)
    await expect(steps(page).nth(0)).toContainText("Your system is ready to review")
    await expect(steps(page).nth(0)).toContainText("1 item needs your decision")
  })

  test("A: sending your details opens the setup wizard", async ({ page }) => {
    await open(page, URL)
    await page.getByRole("link", { name: "Send website or price list" }).click()
    await expect(page).toHaveURL(/\/welcome\/setup\/sources$/)
  })

  test("C: reviewing isn't built yet and says so", async ({ page }) => {
    await open(page, `${URL}?mock=draft-ready`)
    await page.getByRole("button", { name: "Review and approve" }).click()
    await expect(page.getByText("The setup wizard is coming soon")).toBeVisible()
  })

  test("the booking page step opens the booking page", async ({ page }) => {
    await open(page, URL)
    await page.getByRole("link", { name: "Open page" }).click()
    await expect(page).toHaveURL(/\/booking-page$/)
  })

  test("each call to action is described by its step title", async ({ page }) => {
    await open(page, URL)
    await expect(page.getByRole("link", { name: "Open page" })).toHaveAccessibleDescription(
      "View your booking page"
    )
  })
})

test.describe("after import (D)", () => {
  test("success card and the next steps, settings first", async ({ page }) => {
    await open(page, `${URL}?mock=imported`)
    await expect(page.getByText("Bikes Mallorca · Palma de Mallorca")).toBeVisible()
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: "Your equipment and price lists are in the system",
      })
    ).toBeVisible()
    await expect(page.getByText(/demo data removed/)).toBeVisible()
    const next = steps(page, "Next steps")
    await expect(next).toHaveCount(5)
    await expect(next.nth(0)).toContainText("Finish your rental settings")
    await expect(page.getByText("0 of 5 steps done")).toBeAttached()
  })

  test("finished settings and connected payments leave three steps", async ({ page }) => {
    await open(page, `${URL}?mock=imported-paid`)
    await expect(
      page.getByRole("heading", {
        name: "Your equipment, price lists and rental terms are in the system",
      })
    ).toBeVisible()
    await expect(page.getByText(/20% deposit · delivery/)).toBeVisible()
    await expect(steps(page, "Next steps")).toHaveCount(3)
  })

  test("the booking page link opens in a new tab and says so", async ({ page }) => {
    await open(page, `${URL}?mock=imported`)
    const link = page.getByRole("link", { name: /View booking page with your data/ })
    await expect(link).toHaveAccessibleName(/opens in a new tab/)
    await expect(link).toHaveAttribute("target", "_blank")
  })
})

test.describe("errors", () => {
  test("a failed load says so and can be retried", async ({ page }) => {
    await open(page, `${URL}?mock=error`)
    await expect(page.getByRole("alert").filter({ hasText: "couldn't be loaded" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Try again" })).toBeVisible()
  })
})
