import { expect, test, type Page } from "@playwright/test"

import { expectNoAxeViolations, open, THEMES } from "./helpers"

const URL = "/welcome/setup/equipment"

const list = (page: Page) => page.getByRole("list", { name: "Your equipment" })
const rows = (page: Page) => list(page).getByRole("listitem")
const row = (page: Page, name: string) => rows(page).filter({ hasText: name })
const panel = (page: Page) => page.getByRole("dialog")

async function openAddPanel(page: Page) {
  await page.getByRole("button", { name: "Add equipment" }).first().click()
  await expect(panel(page)).toBeVisible()
  return panel(page)
}

async function fillItem(page: Page, name: string, units = "14", price = "18") {
  const p = panel(page)
  await p.getByRole("textbox", { name: "Name" }).fill(name)
  await p.getByRole("combobox", { name: "Category" }).click()
  await page.getByRole("option", { name: "Bikes", exact: true }).click()
  await p.getByRole("textbox", { name: "Number of units" }).fill(units)
  await p.getByRole("textbox", { name: "Price per day" }).fill(price)
}

test.describe("demo examples", () => {
  test("three examples with photos, codes, prices and a Demo data badge", async ({ page }) => {
    await open(page, URL)
    await expect(page.getByRole("heading", { level: 1, name: "Your equipment" })).toBeVisible()
    await expect(rows(page)).toHaveCount(3)
    for (const [name, code] of [
      ["Trek Marlin 7 Mountain Bike", "BIK-001"],
      ["Club Car Tempo", "GLF-001"],
      ["Wilson Pro Staff RF97 Autograph", "TNS-001"],
    ] as const) {
      await expect(row(page, name)).toContainText("Demo data")
      await expect(row(page, name)).toContainText(code)
      await expect(row(page, name).locator("img")).toHaveJSProperty("complete", true)
    }
    await expect(row(page, "Trek Marlin 7")).toContainText("$35.00 / day · $180.00 / week")
    await expect(page.getByText(/3 demo examples, not saved when you approve/)).toBeVisible()
  })

  test("only demo examples can't be approved, and the page says why", async ({ page }) => {
    await open(page, URL)
    await page.getByRole("button", { name: "Approve" }).click()
    await expect(page.getByRole("alert").filter({ hasText: "Add at least one item" })).toBeVisible()
  })

  test("an item opens and closes from the keyboard", async ({ page }) => {
    await open(page, URL)
    const trigger = page.getByRole("button", { name: /^Club Car Tempo/ })
    await expect(trigger).toHaveAttribute("aria-expanded", "false")
    await trigger.focus()
    await page.keyboard.press("Enter")
    await expect(trigger).toHaveAttribute("aria-expanded", "true")
    await expect(
      row(page, "Club Car Tempo").getByRole("textbox", { name: "Price per day" })
    ).toBeVisible()
  })

  test("removing an example can be undone", async ({ page }) => {
    await open(page, URL)
    await page.getByRole("button", { name: /^Club Car Tempo/ }).click()
    await page.getByRole("button", { name: "Remove Club Car Tempo" }).click()
    await expect(rows(page)).toHaveCount(2)
    await page.getByRole("button", { name: "Undo" }).click()
    await expect(rows(page)).toHaveCount(3)
  })
})

test.describe("prices in place", () => {
  test("a valid price saves on leaving the field; a wrong one shows an error", async ({ page }) => {
    await open(page, URL)
    const trek = row(page, "Trek Marlin 7")
    const perDay = trek.getByRole("textbox", { name: "Price per day" })
    await perDay.fill("abc")
    await perDay.press("Tab")
    await expect(perDay).toHaveAttribute("aria-invalid", "true")
    await expect(trek.getByText("Enter an amount, e.g. 25 or 24.50.")).toBeVisible()
    await perDay.fill("40")
    await perDay.press("Tab")
    await expect(trek).toContainText("$40.00 / day")
    await page.reload()
    await expect(row(page, "Trek Marlin 7")).toContainText("$40.00 / day")
  })
})

test.describe("side panel", () => {
  test("errors at the fields after the first save; focus on the first one", async ({ page }) => {
    await open(page, URL)
    const p = await openAddPanel(page)
    await p.getByRole("button", { name: "Add equipment" }).click()
    await expect(p.getByRole("textbox", { name: "Name" })).toBeFocused()
    await expect(p.getByText("Enter a name.")).toBeVisible()
    await expect(p.getByText("Choose a category.")).toBeVisible()
    await expect(p.getByText("Enter a price per day.")).toBeVisible()
  })

  test("add an item: the category suggests the code; it joins the list", async ({ page }) => {
    await open(page, URL)
    const p = await openAddPanel(page)
    await fillItem(page, "City bike")
    await expect(p.getByRole("textbox", { name: "Code" })).toHaveValue("BIK")
    await expect(p.getByText("Units get codes BIK-001, BIK-002, …")).toBeVisible()
    await p.getByRole("button", { name: "Add equipment" }).click()
    await expect(panel(page)).toBeHidden()
    // Numbering continues after the demo bike: BIK-002…BIK-015.
    await expect(row(page, "City bike")).toContainText("14 units: BIK-002…BIK-015")
    await expect(row(page, "City bike")).not.toContainText("Demo data")
  })

  test("save and add another keeps the panel open with an empty form", async ({ page }) => {
    await open(page, URL)
    const p = await openAddPanel(page)
    await fillItem(page, "E-bike", "8", "35")
    await p.getByRole("button", { name: "Save and add another" }).click()
    await expect(p.getByRole("textbox", { name: "Name" })).toHaveValue("")
    await expect(p.getByRole("textbox", { name: "Name" })).toBeFocused()
    await page.keyboard.press("Escape")
    await expect(rows(page)).toHaveCount(4)
  })

  test("editing an example makes it the customer's own", async ({ page }) => {
    await open(page, URL)
    await page.getByRole("button", { name: "Edit details of Trek Marlin 7 Mountain Bike" }).click()
    const p = panel(page)
    await expect(p.getByText("This is a demo example.")).toBeVisible()
    await p.getByRole("textbox", { name: "Number of units" }).fill("5")
    await p.getByRole("button", { name: "Save" }).click()
    await expect(row(page, "Trek Marlin 7")).not.toContainText("Demo data")
    await expect(row(page, "Trek Marlin 7")).toContainText("5 units: BIK-001…BIK-005")
  })

  for (const theme of THEMES)
    test(`axe with the panel open and errors shown — ${theme}`, async ({ page }) => {
      await open(page, URL, theme)
      const p = await openAddPanel(page)
      await p.getByRole("button", { name: "Add equipment" }).click()
      await expect(p.getByText("Enter a name.")).toBeVisible()
      await expectNoAxeViolations(page, '[role="dialog"]')
    })
})

test.describe("approve", () => {
  test("own items replace the demo data and Welcome shows what's in the system", async ({
    page,
  }) => {
    await open(page, URL)
    const p = await openAddPanel(page)
    await fillItem(page, "City bike")
    await p.getByRole("button", { name: "Add equipment" }).click()
    await expect(panel(page)).toBeHidden()

    await page.getByRole("button", { name: "Approve" }).click()
    const dialog = page.getByRole("alertdialog")
    await expect(dialog).toContainText("We'll add 1 item (14 units)")
    await expect(dialog).toContainText("including the 3 demo examples")
    await dialog.getByRole("button", { name: "Approve and replace demo" }).click()

    await expect(page).toHaveURL(/\/welcome$/)
    await expect(page.getByText("1 category · 14 units · demo data removed")).toBeVisible()
    await expect(
      page.getByRole("list", { name: "Next steps" }).getByRole("listitem").first()
    ).toContainText("Finish your rental settings")
  })

  for (const theme of THEMES)
    test(`axe on the confirmation — ${theme}`, async ({ page }) => {
      await open(page, URL, theme)
      const p = await openAddPanel(page)
      await fillItem(page, "City bike")
      await p.getByRole("button", { name: "Add equipment" }).click()
      await expect(panel(page)).toBeHidden()
      await page.getByRole("button", { name: "Approve" }).click()
      await expect(page.getByRole("alertdialog")).toBeVisible()
      await expectNoAxeViolations(page)
    })
})
