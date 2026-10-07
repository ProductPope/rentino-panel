import { expect, test, type Page } from "@playwright/test"

import { expectNoAxeViolations, open, THEMES } from "./helpers"

const URL = "/welcome/setup/equipment"

const list = (page: Page) => page.getByRole("list", { name: "Your equipment" })
const rows = (page: Page) => list(page).locator(":scope > li")
const row = (page: Page, name: string) => rows(page).filter({ hasText: name })
const panel = (page: Page) => page.getByRole("dialog")

const SECTIONS = ["Units", "Rental rates", "Dynamic pricing", "Other settings"]

/** Sections after the first start collapsed: open them. */
const expandAll = (page: Page) => expand(page, SECTIONS)

async function openAddPanel(page: Page, { expand = true } = {}) {
  await page.getByRole("button", { name: "Add equipment" }).first().click()
  await expect(panel(page)).toBeVisible()
  if (expand) await expandAll(page)
  return panel(page)
}

/** Items start collapsed: open the row, then its panel. */
async function editItem(page: Page, name: string, { expand = true } = {}) {
  const trigger = page.getByRole("button", { name: new RegExp(`^${name}`) })
  if ((await trigger.getAttribute("aria-expanded")) !== "true") await trigger.click()
  await page.getByRole("button", { name: `Edit prices and details of ${name}` }).click()
  await expect(panel(page)).toBeVisible()
  if (expand) await expandAll(page)
  return panel(page)
}

async function expand(page: Page, names: string[]) {
  for (const name of names) {
    const trigger = panel(page).getByRole("button", { name, exact: true })
    if ((await trigger.getAttribute("aria-expanded")) !== "true") await trigger.click()
    await expect(trigger).toHaveAttribute("aria-expanded", "true")
  }
}

async function fillItem(page: Page, name: string, units = "14", price = "18") {
  const p = panel(page)
  await expand(page, ["Units", "Rental rates"])
  await p.getByRole("textbox", { name: "Name" }).fill(name)
  await p.getByRole("combobox", { name: "Parent category" }).click()
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
    await expect(row(page, "Trek Marlin 7")).toContainText(
      "from $7.00 / hour · from $26.00 / day · $180.00 / week · 2 price rules"
    )
    await expect(page.getByText(/3 demo examples, not saved when you approve/)).toBeVisible()
  })

  test("only demo examples can't be approved, and the page says why", async ({ page }) => {
    await open(page, URL)
    await page.getByRole("button", { name: "Approve" }).click()
    await expect(page.getByRole("alert").filter({ hasText: "Add at least one item" })).toBeVisible()
  })

  test("an item opens and closes from the keyboard; all start closed", async ({ page }) => {
    await open(page, URL)
    for (const name of ["Trek Marlin 7", "Club Car Tempo", "Wilson Pro Staff"])
      await expect(page.getByRole("button", { name: new RegExp(`^${name}`) })).toHaveAttribute(
        "aria-expanded",
        "false"
      )
    const trigger = page.getByRole("button", { name: /^Club Car Tempo/ })
    await expect(trigger).toHaveAttribute("aria-expanded", "false")
    await trigger.focus()
    await page.keyboard.press("Enter")
    await expect(trigger).toHaveAttribute("aria-expanded", "true")
    // The opened item shows its whole price list, read-only.
    const cart = row(page, "Club Car Tempo")
    await expect(cart.getByRole("region", { name: "Hourly packages" })).toContainText("4 hours")
    await expect(cart.getByRole("region", { name: "Hourly packages" })).toContainText("$90.00")
    await expect(cart.getByRole("region", { name: "Price rules" })).toContainText("+15% · Sat, Sun")
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

test.describe("price list in the panel", () => {
  test("an example opens with its rates in tabs and its rules", async ({ page }) => {
    await open(page, URL)
    const p = await editItem(page, "Trek Marlin 7 Mountain Bike")
    const tabs = p.getByRole("tablist", { name: "Rate types" })
    await expect(tabs.getByRole("tab", { name: /Daily/ })).toHaveAttribute("aria-selected", "true")
    await expect(tabs.getByRole("tab", { name: /Daily/ })).toHaveAccessibleName(/3 set/)
    const daily = p.getByRole("list", { name: "Daily ranges" })
    await expect(daily.getByRole("listitem")).toHaveCount(3)
    await expect(
      daily.getByRole("listitem").nth(2).getByRole("textbox", { name: "Day to" })
    ).toHaveValue("")
    await tabs.getByRole("tab", { name: /Per hour/ }).click()
    await expect(
      p.getByRole("list", { name: "Per hour ranges" }).getByRole("listitem")
    ).toHaveCount(2)
    const rules = p.getByRole("list", { name: "Price rules" }).getByRole("listitem")
    await expect(rules).toHaveCount(2)
    await expect(rules.nth(1).getByRole("button", { name: "Saturday" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
  })

  test("hourly ranges and a weekend rule; overlapping ranges are an error in their tab", async ({
    page,
  }) => {
    await open(page, URL)
    const p = await openAddPanel(page)
    await fillItem(page, "City bike")
    await p.getByRole("tab", { name: "Per hour" }).click()
    await p.getByRole("button", { name: "Add a range" }).click()
    const hours = p.getByRole("list", { name: "Per hour ranges" }).getByRole("listitem")
    await hours.nth(0).getByRole("textbox", { name: "Hour to" }).fill("3")
    await hours.nth(0).getByRole("textbox", { name: "Price per hour" }).fill("8")
    await p.getByRole("button", { name: "Add a range" }).click()
    await expect(hours.nth(1).getByRole("textbox", { name: "Hour from" })).toHaveValue("4")
    await hours.nth(1).getByRole("textbox", { name: "Hour from" }).fill("2")
    await hours.nth(1).getByRole("textbox", { name: "Price per hour" }).fill("6")

    await p.getByRole("button", { name: "Add a rule" }).click()
    const rule = p.getByRole("list", { name: "Price rules" }).getByRole("listitem").first()
    await rule.getByRole("combobox", { name: "Date type" }).click()
    await page.getByRole("option", { name: "Days of the week" }).click()
    await rule.getByRole("button", { name: "Saturday" }).click()
    await rule.getByRole("button", { name: "Sunday" }).click()
    await rule.getByRole("textbox", { name: "Value" }).fill("10")

    // Go to another tab, then save: the error opens its tab and gets focus.
    await p.getByRole("tab", { name: /Daily/ }).click()
    await p.getByRole("button", { name: "Add equipment" }).click()
    const from = hours.nth(1).getByRole("textbox", { name: "Hour from" })
    await expect(from).toBeFocused()
    await expect(p.getByText("Overlaps another range. Start after 3 hours.")).toBeVisible()
    await expect(p.getByRole("tab", { name: /Per hour/ })).toHaveAccessibleName(/has errors/)

    await from.fill("4")
    await p.getByRole("button", { name: "Add equipment" }).click()
    await expect(panel(page)).toBeHidden()
    await expect(row(page, "City bike")).toContainText(
      "from $6.00 / hour · $18.00 / day · 1 price rule"
    )
  })

  test("a rule needs a change and its dates or days", async ({ page }) => {
    await open(page, URL)
    const p = await openAddPanel(page)
    await fillItem(page, "Kayak")
    await p.getByRole("button", { name: "Add a rule" }).click()
    await p.getByRole("button", { name: "Add equipment" }).click()
    await expect(p.getByRole("textbox", { name: "Value" })).toBeFocused()
    await expect(p.getByText("Enter a change, e.g. 20 or -15.")).toBeVisible()
    await expect(p.getByText("Choose the first and last day.")).toBeVisible()
    await expect(p.getByText(/Rules add up before the final price/)).toBeVisible()
  })

  test("removing every rate is an error", async ({ page }) => {
    await open(page, URL)
    const p = await openAddPanel(page)
    await fillItem(page, "Kayak")
    await p.getByRole("button", { name: "Delete range 1" }).click()
    await p.getByRole("button", { name: "Add equipment" }).click()
    await expect(p.getByText("Add at least one rate — for example a daily price.")).toBeVisible()
  })

  for (const theme of THEMES)
    test(`axe with hourly ranges and a rule in the panel — ${theme}`, async ({ page }) => {
      await open(page, URL, theme)
      const p = await openAddPanel(page)
      await p.getByRole("tab", { name: "Per hour" }).click()
      await p.getByRole("button", { name: "Add a range" }).click()
      await p.getByRole("button", { name: "Add a rule" }).click()
      await p.getByRole("button", { name: "Add equipment" }).click()
      await expect(p.getByText("Enter a change, e.g. 20 or -15.")).toBeVisible()
      await expectNoAxeViolations(page, '[role="dialog"]')
    })
})

test.describe("side panel", () => {
  test("only the first section starts open; a save opens the sections with errors", async ({
    page,
  }) => {
    await open(page, URL)
    const p = await openAddPanel(page, { expand: false })
    await expect(p.getByRole("button", { name: "Equipment", exact: true })).toHaveAttribute(
      "aria-expanded",
      "true"
    )
    for (const name of SECTIONS)
      await expect(p.getByRole("button", { name, exact: true })).toHaveAttribute(
        "aria-expanded",
        "false"
      )
    await p.getByRole("textbox", { name: "Name" }).fill("Kayak")
    await p.getByRole("button", { name: "Add equipment" }).click()
    // The daily price is missing: its section opens and the field takes focus.
    await expect(p.getByRole("textbox", { name: "Price per day" })).toBeFocused()
    await expect(p.getByRole("button", { name: "Rental rates", exact: true })).toHaveAttribute(
      "aria-expanded",
      "true"
    )
    await expect(p.getByRole("button", { name: "Units", exact: true })).toHaveAttribute(
      "aria-expanded",
      "false"
    )
  })

  test("errors at the fields after the first save; focus on the first one", async ({ page }) => {
    await open(page, URL)
    const p = await openAddPanel(page)
    await p.getByRole("button", { name: "Add equipment" }).click()
    await expect(p.getByRole("textbox", { name: "Name" })).toBeFocused()
    await expect(p.getByText("Enter a name.")).toBeVisible()
    // The parent category is optional.
    await expect(p.getByText("Choose a category.")).toHaveCount(0)
    await expect(p.getByText("Enter a price.")).toBeVisible()
  })

  test("add an item: the code is the first five letters of the name; it joins the list", async ({
    page,
  }) => {
    await open(page, URL)
    const p = await openAddPanel(page)
    await fillItem(page, "City bike")
    await expect(p.getByRole("textbox", { name: "Code" })).toHaveValue("CITYB")
    await expect(
      p.getByText("Units get codes from CITYB-001; you can change each unit's code below.")
    ).toBeVisible()
    // A code typed by hand stays when the name changes.
    await p.getByRole("textbox", { name: "Code" }).fill("BIK")
    await p.getByRole("textbox", { name: "Name" }).fill("City bike 2")
    await expect(p.getByRole("textbox", { name: "Code" })).toHaveValue("BIK")
    await p.getByRole("button", { name: "Add equipment" }).click()
    await expect(panel(page)).toBeHidden()
    // Numbering continues after the demo bike: BIK-002…BIK-015.
    await expect(row(page, "City bike 2")).toContainText("14 units: BIK-002…BIK-015")
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
    const p = await editItem(page, "Trek Marlin 7 Mountain Bike")
    await expect(p.getByText("This is a demo example.")).toBeVisible()
    await p.getByRole("textbox", { name: "Number of units" }).fill("5")
    await p.getByRole("button", { name: "Save" }).click()
    await expect(row(page, "Trek Marlin 7")).not.toContainText("Demo data")
    await expect(row(page, "Trek Marlin 7")).toContainText("5 units: BIK-001…BIK-005")
  })

  test("without a parent category the item still saves", async ({ page }) => {
    await open(page, URL)
    const p = await openAddPanel(page)
    await p.getByRole("textbox", { name: "Name" }).fill("Kayak")
    await p.getByRole("textbox", { name: "Code" }).fill("KAY")
    await p.getByRole("textbox", { name: "Number of units" }).fill("2")
    await p.getByRole("textbox", { name: "Price per day" }).fill("30")
    await p.getByRole("button", { name: "Add equipment" }).click()
    await expect(panel(page)).toBeHidden()
    await expect(row(page, "Kayak")).toContainText("2 units: KAY-001…KAY-002")
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

test.describe("units", () => {
  const units = (page: Page) => panel(page).getByRole("list", { name: "Units" })
  const unit = (page: Page, code: string) =>
    units(page).getByRole("listitem", { name: `Unit ${code}` })
  const photo = {
    name: "unit.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    ),
  }
  const editTrek = (page: Page) => editItem(page, "Trek Marlin 7 Mountain Bike")

  test("a unit gets its own code, name and photo; others show the equipment's", async ({
    page,
  }) => {
    await open(page, URL)
    await editTrek(page)
    const p = panel(page)
    await p.getByRole("textbox", { name: "Number of units" }).fill("3")
    await expect(units(page).getByRole("listitem")).toHaveCount(3)
    // Units without a photo of their own show the equipment photo.
    await expect(unit(page, "BIK-002").locator("img")).toHaveAttribute("src", /trek/i)

    await unit(page, "BIK-002").getByRole("button", { name: "Edit unit BIK-002" }).click()
    // The row is named after its code, which changes as you type: find it by position.
    const u = units(page).getByRole("listitem").nth(1)
    await u.getByRole("textbox", { name: "Unit code" }).fill("wsbc 123")
    await expect(u.getByRole("textbox", { name: "Unit code" })).toHaveValue("WSBC123")
    await u.getByRole("textbox", { name: "Unit name" }).fill("Size L, red")
    await u.getByLabel("Unit photo").setInputFiles(photo)
    await expect(u.getByRole("button", { name: "Remove the photo of WSBC123" })).toBeVisible()
    await expect(u).toContainText("own code · own name · own photo")
    await p.getByRole("button", { name: "Save" }).click()
    await expect(panel(page)).toBeHidden()

    const trek = row(page, "Trek Marlin 7")
    await expect(trek).toContainText("3 units: BIK-001, WSBC123, BIK-003")
    await expect(trek.getByRole("heading", { name: "Units with their own details" })).toBeVisible()
    await expect(trek).toContainText("Size L, red")
  })

  test("a code another unit uses is an error at that unit, which opens and takes focus", async ({
    page,
  }) => {
    await open(page, URL)
    await editTrek(page)
    const p = panel(page)
    await p.getByRole("textbox", { name: "Number of units" }).fill("2")
    await unit(page, "BIK-002").getByRole("button", { name: "Edit unit BIK-002" }).click()
    await units(page)
      .getByRole("listitem")
      .nth(1)
      .getByRole("textbox", { name: "Unit code" })
      .fill("GLF-001")
    // Collapse it: the error opens it again.
    await unit(page, "GLF-001").getByRole("button", { name: "Edit unit GLF-001" }).click()
    await p.getByRole("button", { name: "Save" }).click()
    const code = unit(page, "GLF-001").getByRole("textbox", { name: "Unit code" })
    await expect(code).toBeFocused()
    await expect(p.getByText("GLF-001 is already used. Codes must be unique.")).toBeVisible()
    await expect(panel(page)).toBeVisible()
  })

  test("long lists show ten units, then all", async ({ page }) => {
    await open(page, URL)
    await editTrek(page)
    await panel(page).getByRole("textbox", { name: "Number of units" }).fill("25")
    await expect(units(page).getByRole("listitem")).toHaveCount(10)
    await panel(page).getByRole("button", { name: "Show all 25 units" }).click()
    await expect(units(page).getByRole("listitem")).toHaveCount(25)
  })

  for (const theme of THEMES)
    test(`axe with a unit open — ${theme}`, async ({ page }) => {
      await open(page, URL, theme)
      await editTrek(page)
      await unit(page, "BIK-001").getByRole("button", { name: "Edit unit BIK-001" }).click()
      await expect(unit(page, "BIK-001").getByRole("textbox", { name: "Unit code" })).toBeVisible()
      await expectNoAxeViolations(page, '[role="dialog"]')
    })
})

test.describe("other settings", () => {
  test("hidden online: the list says so", async ({ page }) => {
    await open(page, URL)
    const p = await openAddPanel(page)
    await fillItem(page, "Kayak", "2", "30")
    await expect(p.getByRole("textbox", { name: "Booking page address" })).toHaveValue("kayak")
    await expect(p.getByText("https://bikesmallorca.rentino.app/product/kayak")).toBeVisible()
    await p.getByRole("switch", { name: "Show on your booking page" }).click()
    await expect(p.getByText("Hidden online. You can still book it")).toBeVisible()
    await p.getByRole("button", { name: "Add equipment" }).click()
    await expect(panel(page)).toBeHidden()
    await expect(row(page, "Kayak")).toContainText("Hidden online")
  })

  test("an address another item uses is an error; it opens the section", async ({ page }) => {
    await open(page, URL)
    const p = await openAddPanel(page, { expand: false })
    await fillItem(page, "Trek Marlin 7")
    await p.getByRole("button", { name: "Add equipment" }).click()
    const address = p.getByRole("textbox", { name: "Booking page address" })
    await expect(address).toBeFocused()
    await expect(p.getByText("Another item uses “trek-marlin-7”.")).toBeVisible()
    await address.fill("Trek Marlin 7 Blue")
    await expect(address).toHaveValue("trek-marlin-7-blue")
    await p.getByRole("button", { name: "Add equipment" }).click()
    await expect(panel(page)).toBeHidden()
  })

  test("descriptions per language and custom fields are kept", async ({ page }) => {
    await open(page, URL)
    const p = await editItem(page, "Trek Marlin 7 Mountain Bike")
    const languages = p.getByRole("tablist", { name: "Description" })
    await expect(languages.getByRole("tab", { name: /^EN/ })).toHaveAccessibleName(/written/)
    await languages.getByRole("tab", { name: /^PL/ }).click()
    await p.getByRole("textbox", { name: "Description in Polish" }).fill("Lekki rower górski.")
    await languages.getByRole("tab", { name: /^AR/ }).click()
    await expect(p.getByRole("textbox", { name: "Description in Arabic" })).toHaveAttribute(
      "dir",
      "rtl"
    )
    const picker = p.getByRole("combobox", { name: "Custom checkout fields" })
    await expect(picker).toContainText("Rider height")
    await picker.click()
    await page.getByRole("option", { name: "Shoe size" }).click()
    await page.keyboard.press("Escape")
    await expect(picker).toContainText("Rider height, Shoe size")
    await p.getByRole("button", { name: "Save" }).click()
    await expect(panel(page)).toBeHidden()

    const again = await editItem(page, "Trek Marlin 7 Mountain Bike")
    await expect(
      again.getByRole("tablist", { name: "Description" }).getByRole("tab", { name: /^PL/ })
    ).toHaveAccessibleName(/written/)
    await expect(again.getByRole("combobox", { name: "Custom checkout fields" })).toContainText(
      "Rider height, Shoe size"
    )
  })

  for (const theme of THEMES)
    test(`axe on other settings, with the field list open — ${theme}`, async ({ page }) => {
      await open(page, URL, theme)
      const p = await editItem(page, "Trek Marlin 7 Mountain Bike")
      await expect(p.getByRole("link", { name: /See it live/ })).toBeVisible()
      await expectNoAxeViolations(page, '[role="dialog"]')
      await p.getByRole("combobox", { name: "Custom description fields" }).click()
      await expect(page.getByRole("option", { name: "Frame size" })).toBeVisible()
      await expectNoAxeViolations(page)
    })
})

test.describe("approve", () => {
  test("own items replace the demo data; settings come next, Welcome shows what's in", async ({
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

    await expect(page).toHaveURL(/\/welcome\/setup\/settings$/)
    await expect(page.getByText("Step 4 of 5 · Settings")).toBeVisible()
    await page.getByRole("link", { name: "I'll finish later" }).click()
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
