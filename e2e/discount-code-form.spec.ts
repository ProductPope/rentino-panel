import { expect, test, type Page } from "@playwright/test"

import { expectNoAxeViolations, open, THEMES } from "./helpers"

const URL = "/settings/discount-codes"

const table = (page: Page) => page.getByRole("table", { name: "Discount codes" })
const row = (page: Page, code: string) =>
  table(page)
    .getByRole("row")
    .filter({ has: page.getByRole("cell", { name: code, exact: true }) })
const panel = (page: Page) => page.getByRole("dialog")
const field = (page: Page, name: string) => panel(page).getByRole("textbox", { name })

async function openAdd(page: Page) {
  await page.getByRole("button", { name: "Add code" }).click()
  await expect(panel(page)).toBeVisible()
  await expect(panel(page).getByRole("heading", { name: "Add code" })).toBeVisible()
}

async function openEdit(page: Page, code: string) {
  await page.getByRole("button", { name: `Actions for ${code}` }).click()
  await page.getByRole("menuitem", { name: "Edit" }).click()
  await expect(panel(page).getByRole("heading", { name: `Edit code ${code}` })).toBeVisible()
}

async function auditLog(page: Page) {
  const raw = await page.evaluate(() => localStorage.getItem("rentino.mock.audit-log"))
  return JSON.parse(raw ?? "[]") as { action: string; subject: string }[]
}

test.describe("add code", () => {
  test("opens narrow with focus on Code; Escape closes and returns focus", async ({ page }) => {
    await open(page, URL)
    const add = page.getByRole("button", { name: "Add code" })
    await add.click()
    await expect(field(page, "Code")).toBeFocused()
    await expect(panel(page).getByRole("button", { name: "Narrow" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
    await page.keyboard.press("Escape")
    await expect(panel(page)).toBeHidden()
    await expect(add).toBeFocused()
  })

  test("saving empty shows errors at the fields and focuses the first one", async ({ page }) => {
    await open(page, URL)
    await openAdd(page)
    await panel(page).getByRole("button", { name: "Save", exact: true }).click()
    const code = field(page, "Code")
    await expect(code).toHaveAttribute("aria-invalid", "true")
    await expect(code).toHaveAccessibleDescription(/Enter a code\./)
    await expect(field(page, "Value")).toHaveAttribute("aria-invalid", "true")
    await expect(panel(page).getByText("Enter a value.")).toBeVisible()
    await expect(code).toBeFocused()
    // Errors update as you type once shown.
    await code.fill("ZIMA")
    await expect(code).not.toHaveAttribute("aria-invalid", "true")
  })

  test("upper-cases the code, rejects other characters and duplicates", async ({ page }) => {
    await open(page, URL)
    await openAdd(page)
    const code = field(page, "Code")
    await code.fill("spring sale")
    await expect(code).toHaveValue("SPRINGSALE")
    await code.fill("welcome50")
    await field(page, "Value").fill("10")
    await panel(page).getByRole("button", { name: "Save", exact: true }).click()
    await expect(
      panel(page).getByText("A code “WELCOME50” already exists.", { exact: false })
    ).toBeVisible()
    await expect(code).toBeFocused()
    await code.fill("ŻUBR")
    await expect(panel(page).getByText(/Use only letters/)).toBeVisible()
  })

  test("percentage must be 0.01–100; a fixed amount must be above 0", async ({ page }) => {
    await open(page, URL)
    await openAdd(page)
    await field(page, "Code").fill("TEST")
    const value = field(page, "Value")
    await value.fill("150")
    await panel(page).getByRole("button", { name: "Save", exact: true }).click()
    await expect(panel(page).getByText("Percentage must be between 0.01 and 100.")).toBeVisible()
    await expect(value).toBeFocused()
    await panel(page).getByRole("radio", { name: "Fixed amount" }).check()
    await expect(panel(page).getByText("Percentage must be between")).toHaveCount(0)
    await value.fill("0")
    await expect(panel(page).getByText("Amount must be greater than 0.")).toBeVisible()
  })

  test("Save creates the code, closes, confirms, logs and persists", async ({ page }) => {
    await open(page, URL)
    await openAdd(page)
    await field(page, "Code").fill("autumn10")
    await field(page, "Value").fill("10")
    await field(page, "Note").fill("Autumn newsletter")
    await panel(page).getByRole("button", { name: "Save", exact: true }).click()
    await expect(panel(page)).toBeHidden()
    await expect(page.getByText("Code AUTUMN10 created")).toBeVisible()
    await expect(row(page, "AUTUMN10")).toContainText("10%")
    await expect(row(page, "AUTUMN10")).toContainText("Active")
    await expect(row(page, "AUTUMN10")).toContainText("No end date")
    expect((await auditLog(page))[0]).toMatchObject({
      action: "Created",
      subject: "Discount code AUTUMN10",
    })
    await page.reload()
    await expect(row(page, "AUTUMN10")).toBeVisible()
  })

  test("Active off creates an inactive code", async ({ page }) => {
    await open(page, URL)
    await openAdd(page)
    await field(page, "Code").fill("LATER")
    await field(page, "Value").fill("25")
    await panel(page).getByRole("radio", { name: "Fixed amount" }).check()
    await panel(page).getByRole("switch", { name: "Active" }).click()
    await panel(page).getByRole("button", { name: "Save", exact: true }).click()
    await expect(row(page, "LATER")).toContainText("$25.00")
    await expect(row(page, "LATER")).toContainText("Inactive")
  })

  test("Save and stay keeps the panel open on the saved code", async ({ page }) => {
    await open(page, URL)
    await openAdd(page)
    await field(page, "Code").fill("STAY5")
    await field(page, "Value").fill("5")
    await panel(page).getByRole("button", { name: "Save and stay" }).click()
    await expect(page.getByText("Code STAY5 created")).toBeVisible()
    await expect(panel(page).getByRole("heading", { name: "Edit code STAY5" })).toBeVisible()
    // The confirmation must not cover the panel's footer.
    const toast = await page.getByText("Code STAY5 created").boundingBox()
    const footer = await panel(page).getByRole("button", { name: "Save and stay" }).boundingBox()
    expect(toast!.x + toast!.width <= footer!.x || toast!.y + toast!.height <= footer!.y).toBe(true)
    await field(page, "Value").fill("7")
    await panel(page).getByRole("button", { name: "Save", exact: true }).click()
    await expect(panel(page)).toBeHidden()
    await expect(row(page, "STAY5")).toContainText("7%")
    await expect(table(page).getByRole("cell", { name: "STAY5", exact: true })).toHaveCount(1)
  })
})

test.describe("edit code", () => {
  test("shows the saved values and the read-only use count; saves changes", async ({ page }) => {
    await open(page, URL)
    await openEdit(page, "WINTERSALE")
    await expect(panel(page)).toContainText("Used on 42 orders.")
    await expect(field(page, "Code")).toHaveValue("WINTERSALE")
    await expect(field(page, "Value")).toHaveValue("10")
    await expect(panel(page).getByRole("radio", { name: "Percentage" })).toBeChecked()
    await expect(field(page, "Note")).toHaveValue("Winter campaign")
    await expect(panel(page).getByRole("button", { name: "Valid", exact: true })).not.toContainText(
      "Always"
    )

    await field(page, "Value").fill("15")
    await panel(page).getByRole("button", { name: "Save", exact: true }).click()
    await expect(page.getByText("Code WINTERSALE saved")).toBeVisible()
    await expect(row(page, "WINTERSALE")).toContainText("15%")
    expect((await auditLog(page))[0]).toMatchObject({ action: "Edited" })
  })

  test("a used code's text can't change; an unused one can", async ({ page }) => {
    await open(page, URL)
    await openEdit(page, "WELCOME50")
    await expect(field(page, "Code")).toHaveAttribute("readonly", "")
    await expect(field(page, "Code")).toHaveAccessibleDescription(/can't change/)
    await page.keyboard.press("Escape")

    await openEdit(page, "BLACKFRIDAY")
    await expect(field(page, "Code")).not.toHaveAttribute("readonly", "")
    await field(page, "Code").fill("CYBERMONDAY")
    await panel(page).getByRole("button", { name: "Save", exact: true }).click()
    await expect(row(page, "CYBERMONDAY")).toContainText("Scheduled")
    await expect(row(page, "BLACKFRIDAY")).toHaveCount(0)
  })

  test("width switch widens the panel", async ({ page }) => {
    await open(page, URL)
    await openEdit(page, "WINTERSALE")
    const narrow = await panel(page).boundingBox()
    await panel(page).getByRole("button", { name: "Full width" }).click()
    await expect(panel(page).getByRole("button", { name: "Full width" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
    await expect
      .poll(async () => (await panel(page).boundingBox())?.width)
      .toBeGreaterThan(narrow!.width)
  })

  test("focus stays inside the open panel", async ({ page }) => {
    await open(page, URL)
    await openAdd(page)
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press("Tab")
      expect(await panel(page).evaluate((el) => el.contains(document.activeElement))).toBe(true)
    }
  })
})

for (const theme of THEMES) {
  test.describe(`axe on the panel — ${theme}`, () => {
    test("add, empty", async ({ page }) => {
      await open(page, URL, theme)
      await openAdd(page)
      await expectNoAxeViolations(page)
    })

    test("add, with errors", async ({ page }) => {
      await open(page, URL, theme)
      await openAdd(page)
      await panel(page).getByRole("button", { name: "Save", exact: true }).click()
      await expect(field(page, "Code")).toHaveAttribute("aria-invalid", "true")
      await expectNoAxeViolations(page)
    })

    test("edit a used code, full width", async ({ page }) => {
      await open(page, URL, theme)
      await openEdit(page, "WELCOME50")
      await panel(page).getByRole("button", { name: "Full width" }).click()
      await expectNoAxeViolations(page)
    })

    test("date range picker open", async ({ page }) => {
      await open(page, URL, theme)
      await openEdit(page, "WINTERSALE")
      await panel(page).getByRole("button", { name: "Valid", exact: true }).click()
      await expect(page.getByRole("grid").first()).toBeVisible()
      await expectNoAxeViolations(page)
    })

    test("phone: the panel fills the screen without horizontal scroll", async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 })
      await open(page, URL, theme)
      await openAdd(page)
      await expectNoAxeViolations(page)
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
    })
  })
}
