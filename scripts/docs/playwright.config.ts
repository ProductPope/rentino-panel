import { defineConfig, devices } from "@playwright/test"

const PORT = Number(process.env.PORT ?? 3100)

/**
 * Screenshots for the docs (`pnpm docs:screens`, after `pnpm build`). Not part of CI: run it when a
 * screen changes and commit the images in docs/img/.
 */
export default defineConfig({
  testDir: ".",
  testMatch: "screens.spec.ts",
  fullyParallel: true,
  reporter: "list",
  use: { baseURL: `http://localhost:${PORT}` },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm start --port ${PORT}`,
    url: `http://localhost:${PORT}/settings/discount-codes`,
    reuseExistingServer: true,
  },
})
