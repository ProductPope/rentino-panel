import { expect, test, type Page } from "@playwright/test"

import { open, type Theme } from "../../e2e/helpers"

/**
 * One screenshot per documented screen state → docs/img/<name>.jpg. Add a shot when you document a
 * new screen or state; the screen's doc embeds it.
 */
interface Shot {
  name: string
  path: string
  theme?: Theme
  width?: number
  /** Opens a panel or dialog before the shot. */
  act?: (page: Page) => Promise<void>
  /** Signs in as the demo user without "Manage discount codes". */
  staff?: boolean
}

const panel = (page: Page) => page.getByRole("dialog")

const SHOTS: Shot[] = [
  { name: "welcome-a", path: "/welcome" },
  { name: "welcome-a-dark", path: "/welcome", theme: "dark" },
  { name: "welcome-b", path: "/welcome?mock=processing" },
  { name: "welcome-c", path: "/welcome?mock=draft-ready" },
  { name: "welcome-d", path: "/welcome?mock=imported" },
  {
    name: "welcome-plans",
    path: "/welcome",
    act: async (page) => {
      await page.getByRole("button", { name: "Upgrade to Premium" }).click()
      await expect(page.getByRole("dialog")).toBeVisible()
    },
  },
  { name: "setup-1-sources", path: "/welcome/setup/sources" },
  { name: "setup-2-progress", path: "/welcome/setup/progress?mock=processing" },
  { name: "setup-3-equipment", path: "/welcome/setup/equipment" },
  { name: "setup-3-equipment-320", path: "/welcome/setup/equipment", width: 320 },
  {
    name: "setup-3-panel",
    path: "/welcome/setup/equipment",
    act: async (page) => {
      await page.getByRole("button", { name: /^Trek Marlin/ }).click()
      await page
        .getByRole("button", { name: "Edit prices and details of Trek Marlin 7 Mountain Bike" })
        .click()
      await expect(panel(page)).toBeVisible()
    },
  },
  {
    name: "setup-3-panel-other-settings",
    path: "/welcome/setup/equipment",
    act: async (page) => {
      await page.getByRole("button", { name: /^Trek Marlin/ }).click()
      await page
        .getByRole("button", { name: "Edit prices and details of Trek Marlin 7 Mountain Bike" })
        .click()
      // Collapse the first section so the last one is in view.
      await panel(page).getByRole("button", { name: "Equipment", exact: true }).click()
      await panel(page).getByRole("button", { name: "Other settings", exact: true }).click()
    },
  },
  { name: "setup-4-settings", path: "/welcome/setup/settings?mock=imported" },
  { name: "setup-5-start", path: "/welcome/setup/start?mock=imported-settings" },
  { name: "discount-codes", path: "/settings/discount-codes" },
  { name: "discount-codes-dark", path: "/settings/discount-codes", theme: "dark" },
  { name: "discount-codes-320", path: "/settings/discount-codes", width: 320 },
  {
    name: "discount-codes-panel",
    path: "/settings/discount-codes",
    act: async (page) => {
      await page.getByRole("button", { name: "Add code" }).first().click()
      await expect(panel(page)).toBeVisible()
    },
  },
  { name: "discount-codes-no-access", path: "/settings/discount-codes", staff: true },
]

for (const shot of SHOTS)
  test(shot.name, async ({ page, context, baseURL }) => {
    if (shot.staff)
      await context.addCookies([{ name: "mock_user", value: "staff", url: baseURL ?? "" }])
    await page.setViewportSize({ width: shot.width ?? 1280, height: 800 })
    await open(page, shot.path, shot.theme)
    await shot.act?.(page)
    // Let panels and dialogs finish their entry animation.
    await page.waitForTimeout(400)
    await page.screenshot({ path: `docs/img/${shot.name}.jpg`, type: "jpeg", quality: 80 })
  })
