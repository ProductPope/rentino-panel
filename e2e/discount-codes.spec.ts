import { expect, test, type Page } from "@playwright/test"

import { expectNoAxeViolations, open, THEMES } from "./helpers"

const URL = "/settings/discount-codes"

const table = (page: Page) => page.getByRole("table", { name: "Discount codes" })
const row = (page: Page, code: string) =>
  table(page)
    .getByRole("row")
    .filter({ has: page.getByRole("cell", { name: code, exact: true }) })
const bodyRows = (page: Page) => table(page).locator("tbody tr")

async function openActions(page: Page, code: string) {
  await page.getByRole("button", { name: `Actions for ${code}` }).click()
  const menu = page.getByRole("menu")
  await expect(menu).toBeVisible()
  return menu
}

test.describe("list", () => {
  test("shows every code with type, value, validity, uses and a text status", async ({ page }) => {
    await open(page, URL)
    await expect(bodyRows(page)).toHaveCount(7)
    await expect(row(page, "WINTERSALE")).toContainText("Percentage")
    await expect(row(page, "WINTERSALE")).toContainText("10%")
    await expect(row(page, "WINTERSALE")).toContainText("Active")
    await expect(row(page, "WELCOME50")).toContainText("$50.00")
    await expect(row(page, "WELCOME50")).toContainText("No end date")
    await expect(row(page, "BLACKFRIDAY")).toContainText("Scheduled")
    await expect(row(page, "SUMMER15")).toContainText("Expired")
    await expect(row(page, "PARTNER_HOTEL")).toContainText("Inactive")
    await expect(page.getByText("1–7 of 7 codes")).toBeVisible()
  })

  test("marks the table busy while loading", async ({ page }) => {
    await page.goto(URL)
    await expect(table(page)).toHaveAttribute("aria-busy", "true")
    await expect(table(page)).not.toHaveAttribute("aria-busy", "true")
  })

  test("sorts by code from the keyboard and says so", async ({ page }) => {
    await open(page, URL)
    const header = table(page).getByRole("columnheader", { name: /Code/ })
    await header.getByRole("button").focus()
    await page.keyboard.press("Enter")
    await expect(header).toHaveAttribute("aria-sort", "ascending")
    await expect(bodyRows(page).first()).toContainText("BLACKFRIDAY")
    await expect(page.getByText("Sorted by Code, ascending")).toBeAttached()
  })
})

test.describe("search and filters", () => {
  test("search matches code and internal note, case-insensitive, and announces the count", async ({
    page,
  }) => {
    await open(page, URL)
    const search = page.getByRole("searchbox", { name: "Search codes" })
    await search.fill("wintersale")
    await expect(bodyRows(page)).toHaveCount(1)
    await expect(page.getByText("1 of 7 codes match")).toBeAttached()
    await search.fill("concierge")
    await expect(row(page, "PARTNER_HOTEL")).toBeVisible()
  })

  test("no results says so and clears search and filters in one step", async ({ page }) => {
    await open(page, URL)
    const search = page.getByRole("searchbox", { name: "Search codes" })
    await search.fill("nothing-like-this")
    await expect(page.getByRole("heading", { name: "No codes match" })).toBeVisible()
    await page.getByRole("button", { name: "Clear search and filters" }).click()
    await expect(search).toHaveValue("")
    await expect(search).toBeFocused()
    await expect(bodyRows(page)).toHaveCount(7)
  })

  test("status and type filters combine; the toggle counts them; Clear filters resets", async ({
    page,
  }) => {
    await open(page, URL)
    const toggle = page.getByRole("button", { name: /Filters/ })
    await toggle.click()
    await page.getByRole("combobox", { name: "Status" }).click()
    await page.getByRole("option", { name: "Scheduled" }).click()
    await expect(bodyRows(page)).toHaveCount(2)
    await page.getByRole("combobox", { name: "Type" }).click()
    await page.getByRole("option", { name: "Percentage" }).click()
    await expect(bodyRows(page)).toHaveCount(2)
    await expect(toggle).toContainText("2")
    await page.getByRole("combobox", { name: "Type" }).click()
    await page.getByRole("option", { name: "Fixed amount" }).click()
    await expect(page.getByRole("heading", { name: "No codes match" })).toBeVisible()
    await page.getByRole("button", { name: "Clear filters" }).click()
    await expect(bodyRows(page)).toHaveCount(7)
  })

  test("on a phone the filters open in a sheet", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 740 })
    await open(page, URL)
    await page.getByRole("button", { name: /Filters/ }).click()
    const sheet = page.getByRole("dialog", { name: "Filters" })
    await expect(sheet).toBeVisible()
    await sheet.getByRole("combobox", { name: "Status" }).click()
    await page.getByRole("option", { name: "Expired" }).click()
    await sheet.getByRole("button", { name: "Show results" }).click()
    await expect(sheet).toBeHidden()
    await expect(bodyRows(page)).toHaveCount(1)
  })
})

test.describe("row actions", () => {
  test("menu opens from the keyboard; used codes offer no Delete", async ({ page }) => {
    await open(page, URL)
    const trigger = page.getByRole("button", { name: "Actions for KAYAK5" })
    await trigger.focus()
    await page.keyboard.press("Enter")
    const menu = page.getByRole("menu")
    await expect(menu.getByRole("menuitem")).toHaveText(["Copy code", "Activate", "Delete…"])
    await page.keyboard.press("Escape")
    await expect(trigger).toBeFocused()

    const used = await openActions(page, "WELCOME50")
    await expect(used.getByRole("menuitem")).toHaveText(["Copy code", "Deactivate…"])
  })

  test("Deactivate confirms first, then can be undone from the toast", async ({ page }) => {
    await open(page, URL)
    await (
      await openActions(page, "WINTERSALE")
    )
      .getByRole("menuitem", { name: "Deactivate…" })
      .click()
    const dialog = page.getByRole("alertdialog", { name: "Deactivate code WINTERSALE?" })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused()
    await dialog.getByRole("button", { name: "Deactivate code" }).click()
    await expect(dialog).toBeHidden()
    await expect(row(page, "WINTERSALE")).toContainText("Inactive")
    await expect(page.getByText("Code WINTERSALE deactivated")).toBeVisible()

    await page.getByRole("button", { name: "Undo" }).click()
    await expect(row(page, "WINTERSALE")).toContainText("Active")
  })

  test("Cancel leaves the code as it was", async ({ page }) => {
    await open(page, URL)
    await (
      await openActions(page, "WINTERSALE")
    )
      .getByRole("menuitem", { name: "Deactivate…" })
      .click()
    await page.keyboard.press("Enter") // focus starts on Cancel
    await expect(page.getByRole("alertdialog")).toBeHidden()
    await expect(row(page, "WINTERSALE")).toContainText("Active")
  })

  test("Activate applies at once and is recorded in Logs", async ({ page }) => {
    await open(page, URL)
    await (
      await openActions(page, "PARTNER_HOTEL")
    )
      .getByRole("menuitem", { name: "Activate" })
      .click()
    await expect(row(page, "PARTNER_HOTEL")).toContainText("Active")
    await expect(page.getByText("Code PARTNER_HOTEL activated")).toBeVisible()
    const log = await page.evaluate(() => localStorage.getItem("rentino.mock.audit-log"))
    expect(JSON.parse(log ?? "[]")[0]).toMatchObject({
      action: "Activated",
      subject: "Discount code PARTNER_HOTEL",
    })
  })

  test("Delete removes an unused code for good; focus moves to search", async ({ page }) => {
    await open(page, URL)
    await (await openActions(page, "KAYAK5")).getByRole("menuitem", { name: "Delete…" }).click()
    const dialog = page.getByRole("alertdialog", { name: "Delete code KAYAK5?" })
    await dialog.getByRole("button", { name: "Delete code" }).click()
    await expect(dialog).toBeHidden()
    await expect(row(page, "KAYAK5")).toHaveCount(0)
    await expect(page.getByText("Code KAYAK5 deleted")).toBeVisible()
    await expect(page.getByRole("searchbox", { name: "Search codes" })).toBeFocused()

    await page.reload()
    await expect(bodyRows(page)).toHaveCount(6)
    await expect(row(page, "KAYAK5")).toHaveCount(0)
  })

  test("Copy code puts the code on the clipboard", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"])
    await open(page, URL)
    await (
      await openActions(page, "WELCOME50")
    )
      .getByRole("menuitem", { name: "Copy code" })
      .click()
    await expect(page.getByText("Code WELCOME50 copied")).toBeVisible()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("WELCOME50")
  })
})

test.describe("states", () => {
  test("empty: says there are no codes yet", async ({ page }) => {
    await open(page, `${URL}?mock=empty`)
    await expect(page.getByRole("heading", { name: "No discount codes yet" })).toBeVisible()
  })

  test("error: announced alert with Try again", async ({ page }) => {
    await open(page, `${URL}?mock=error`)
    const alert = page.getByRole("alert").filter({ hasText: "couldn't be loaded" })
    await expect(alert).toBeVisible()
    await expect(page.getByRole("table")).toHaveCount(0)
    // The backend "recovers": drop the scenario, then retry.
    await page.evaluate(() => history.replaceState(null, "", location.pathname))
    await alert.getByRole("button", { name: "Try again" }).click()
    await expect(bodyRows(page)).toHaveCount(7)
  })
})

test.describe("permissions", () => {
  test("without “Manage discount codes” the item is hidden and the page says why", async ({
    page,
    context,
  }) => {
    await context.addCookies([{ name: "mock_user", value: "staff", url: "http://localhost" }])
    await open(page, URL)
    const nav = page.getByRole("navigation", { name: "Main" })
    await expect(nav.getByText("Discount codes")).toHaveCount(0)
    await expect(
      page.getByRole("heading", { name: "You don't have access to discount codes" })
    ).toBeVisible()
    await expect(page.getByRole("table")).toHaveCount(0)
  })
})

for (const theme of THEMES) {
  test.describe(`axe on overlays and states — ${theme}`, () => {
    test("row actions menu", async ({ page }) => {
      await open(page, URL, theme)
      await openActions(page, "KAYAK5")
      await expectNoAxeViolations(page)
    })

    test("deactivate dialog", async ({ page }) => {
      await open(page, URL, theme)
      await (
        await openActions(page, "WINTERSALE")
      )
        .getByRole("menuitem", { name: "Deactivate…" })
        .click()
      await expect(page.getByRole("alertdialog")).toBeVisible()
      await expectNoAxeViolations(page)
    })

    test("delete dialog", async ({ page }) => {
      await open(page, URL, theme)
      await (await openActions(page, "KAYAK5")).getByRole("menuitem", { name: "Delete…" }).click()
      await expect(page.getByRole("alertdialog")).toBeVisible()
      await expectNoAxeViolations(page)
    })

    test("filters open, select open", async ({ page }) => {
      await open(page, URL, theme)
      await page.getByRole("button", { name: /Filters/ }).click()
      await expectNoAxeViolations(page)
      await page.getByRole("combobox", { name: "Status" }).click()
      await expect(page.getByRole("listbox")).toBeVisible()
      await expectNoAxeViolations(page)
    })

    test("filters sheet on a phone", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 740 })
      await open(page, URL, theme)
      await page.getByRole("button", { name: /Filters/ }).click()
      await expect(page.getByRole("dialog", { name: "Filters" })).toBeVisible()
      await expectNoAxeViolations(page)
    })

    test("no results", async ({ page }) => {
      await open(page, URL, theme)
      await page.getByRole("searchbox", { name: "Search codes" }).fill("zzz")
      await expect(page.getByRole("heading", { name: "No codes match" })).toBeVisible()
      await expectNoAxeViolations(page)
    })

    test("toast", async ({ page }) => {
      await open(page, URL, theme)
      await (
        await openActions(page, "PARTNER_HOTEL")
      )
        .getByRole("menuitem", { name: "Activate" })
        .click()
      await expect(page.getByText("Code PARTNER_HOTEL activated")).toBeVisible()
      await expectNoAxeViolations(page)
    })

    test("no access", async ({ page, context }) => {
      await context.addCookies([{ name: "mock_user", value: "staff", url: "http://localhost" }])
      await open(page, URL, theme)
      await expectNoAxeViolations(page)
    })
  })
}
