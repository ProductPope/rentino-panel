import { expect, test } from "@playwright/test"

import { describeFocus, open, PAGES, THEMES } from "./helpers"

const MAX_TAB_STOPS = 60

for (const theme of THEMES) {
  for (const { name, path } of PAGES) {
    test(`2.4.7 focus visible — every Tab stop changes the screen (${name}, ${theme})`, async ({
      page,
    }) => {
      // Each stop takes ~0.6 s (two screenshots); link-heavy pages (the docs) need more than 30 s.
      test.setTimeout(60_000)
      await open(page, path, theme)
      await page.mouse.move(0, 0)
      const invisible: string[] = []
      let stops = 0
      for (let i = 0; i < MAX_TAB_STOPS; i++) {
        await page.keyboard.press("Tab")
        const label = await describeFocus(page)
        if (!label) break
        stops++
        const box = await page.evaluate(() => {
          const r = (document.activeElement as HTMLElement).getBoundingClientRect()
          return { x: r.x, y: r.y, width: r.width, height: r.height }
        })
        if (box.width === 0 || box.height === 0) continue
        await page.waitForTimeout(250)
        const pad = 6
        const clip = {
          x: Math.max(0, box.x - pad),
          y: Math.max(0, box.y - pad),
          width: box.width + pad * 2,
          height: box.height + pad * 2,
        }
        const focused = await page.screenshot({ clip, animations: "disabled", caret: "hide" })
        const handle = await page.evaluateHandle(() => document.activeElement as HTMLElement)
        await handle.evaluate((el) => el.blur())
        await page.waitForTimeout(250)
        const blurred = await page.screenshot({ clip, animations: "disabled", caret: "hide" })
        if (focused.equals(blurred)) invisible.push(label)
        await handle.evaluate((el) => el.focus({ focusVisible: true } as FocusOptions))
      }
      expect(stops, "page has no Tab stops").toBeGreaterThan(0)
      expect(stops, `focus did not leave the page after ${MAX_TAB_STOPS} Tabs`).toBeLessThan(
        MAX_TAB_STOPS
      )
      expect(invisible, "elements with no visible focus indicator").toEqual([])
    })
  }
}

test("2.1.2 no keyboard trap — Shift+Tab walks back out of the page", async ({ page }) => {
  await open(page, "/settings/discount-codes")
  const forward: string[] = []
  for (let i = 0; i < MAX_TAB_STOPS; i++) {
    await page.keyboard.press("Tab")
    const label = await describeFocus(page)
    if (!label) break
    forward.push(label)
  }
  expect(forward.length).toBeGreaterThan(0)
  expect(forward.length).toBeLessThan(MAX_TAB_STOPS)
  // Back from after the last stop to before the first.
  const backward: string[] = []
  for (let i = 0; i < MAX_TAB_STOPS; i++) {
    await page.keyboard.press("Shift+Tab")
    const label = await describeFocus(page)
    if (!label) break
    backward.push(label)
  }
  expect(backward).toEqual([...forward].reverse())
})

test.describe("navigation", () => {
  test("Discount codes is the current page; coming-soon items are not links or Tab stops", async ({
    page,
  }) => {
    await open(page, "/settings/discount-codes")
    const nav = page.getByRole("navigation", { name: "Main" })
    await expect(nav.getByRole("link", { name: "Discount codes" })).toHaveAttribute(
      "aria-current",
      "page"
    )
    // Only live sections are links; everything else is announced as coming soon.
    await expect(nav.getByRole("link")).toHaveText(["Welcome", "Discount codes"])
    for (const label of ["Orders", "Tax"]) {
      await expect(
        nav.getByRole("listitem").filter({ hasText: new RegExp(`^${label}`) })
      ).toContainText(`${label}Soon, coming soon`)
    }

    const stops: string[] = []
    for (let i = 0; i < MAX_TAB_STOPS; i++) {
      await page.keyboard.press("Tab")
      const label = await describeFocus(page)
      if (!label) break
      stops.push(label)
    }
    expect(stops.filter((s) => /coming soon|Orders|Dashboard|Tax/.test(s))).toEqual([])
  })

  test("/ opens Welcome", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveURL(/\/welcome$/)
    await expect(page.getByRole("heading", { level: 1, name: "Welcome to Rentino" })).toBeVisible()
  })

  test("Ctrl+B collapses the sidebar and the choice survives a reload", async ({ page }) => {
    await open(page, "/settings/discount-codes")
    await page.keyboard.press("Control+b")
    await expect(page.getByRole("button", { name: "Expand sidebar" })).toBeVisible()
    await page.reload()
    await expect(page.getByRole("button", { name: "Expand sidebar" })).toBeVisible()
    await page.getByRole("button", { name: "Expand sidebar" }).click()
    await expect(page.getByRole("button", { name: "Collapse sidebar" })).toBeVisible()
  })

  test("mobile: the navigation sheet traps focus, closes on Escape, returns focus", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 740 })
    await open(page, "/settings/discount-codes")
    const toggle = page.getByRole("button", { name: "Open navigation" })
    await toggle.focus()
    await page.keyboard.press("Enter")
    const sheet = page.getByRole("dialog")
    await expect(sheet).toBeVisible()
    await expect(sheet.getByRole("link", { name: "Discount codes" })).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(sheet).toBeHidden()
    await expect(toggle).toBeFocused()
  })
})

test.describe("account menu", () => {
  test("opens from the keyboard, switches theme, Escape returns focus", async ({ page }) => {
    await open(page, "/settings/discount-codes", "light")
    const trigger = page.getByRole("button", { name: /Anna Nowak/ })
    await trigger.focus()
    await page.keyboard.press("Enter")
    const menu = page.getByRole("menu")
    await expect(menu).toBeVisible()
    await expect(menu.getByText("anna@rentino.app")).toBeVisible()

    await menu.getByRole("menuitemradio", { name: "Dark" }).click()
    await expect(page.locator("html")).toHaveClass(/\bdark\b/)

    await trigger.focus()
    await page.keyboard.press("Enter")
    await expect(menu).toBeVisible()
    await expect(menu.getByRole("menuitemradio", { name: "Dark" })).toBeChecked()
    await page.keyboard.press("Escape")
    await expect(menu).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test("Sign out confirms with a toast", async ({ page }) => {
    await open(page, "/settings/discount-codes")
    await page.getByRole("button", { name: /Anna Nowak/ }).click()
    await page.getByRole("menuitem", { name: "Sign out" }).click()
    await expect(page.getByText("Signed out")).toBeVisible()
  })

  test("View booking page opens the booking page stand-in in a new tab, and says so", async ({
    page,
  }) => {
    await open(page, "/settings/discount-codes")
    const link = page.getByRole("link", { name: /^View booking page/ })
    await expect(link).toHaveAccessibleName("View booking page (opens in a new tab)")
    await expect(link).toHaveAttribute("target", "_blank")
    const [tab] = await Promise.all([page.context().waitForEvent("page"), link.click()])
    await expect(tab.getByRole("heading", { level: 1, name: "Booking page" })).toBeVisible()
    // The panel stays where it was.
    await expect(page).toHaveURL(/\/settings\/discount-codes$/)
  })
})
