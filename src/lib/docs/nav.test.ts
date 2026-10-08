import { describe, expect, it } from "vitest"

import { folderNav, screensNav, type NavNode, type NavPage } from "./nav"

const page = (file: string, extra: Partial<NavPage> = {}): NavPage => ({
  file,
  href: `/docs/${file.replace(/(\/)?README\.md$/, "").replace(/\.md$/, "")}`.replace(/\/$/, ""),
  title: file,
  routes: [],
  links: [],
  ...extra,
})

const PAGES: NavPage[] = [
  page("README.md", { links: ["getting-started.md", "mock-data.md", "screens/README.md"] }),
  page("mock-data.md", { title: "Mock data" }),
  page("getting-started.md", { title: "Getting started" }),
  page("screens/README.md", {
    title: "Screens",
    links: ["screens/app-shell.md", "screens/welcome/README.md", "screens/booking-page.md"],
  }),
  page("screens/_template.md"),
  page("screens/app-shell.md", { title: "Panel shell", nav: "Panel shell" }),
  page("screens/booking-page.md", { title: "Booking page", routes: ["/booking-page"] }),
  page("screens/welcome/README.md", {
    title: "Welcome",
    routes: ["/", "/welcome"],
    // Linked backend first on purpose: notes still close the list, mock data first.
    links: ["screens/welcome/backend.md", "screens/welcome/setup/README.md"],
  }),
  page("screens/welcome/backend.md", { title: "Billing backend", nav: "Backend (suggestion)" }),
  page("screens/welcome/mock-data.md", { title: "Welcome mocks", nav: "Mock data and states" }),
  page("screens/welcome/setup/README.md", {
    title: "Setup wizard",
    links: ["screens/welcome/setup/sources.md", "screens/welcome/setup/equipment.md"],
  }),
  page("screens/welcome/setup/equipment.md", { title: "Equipment", nav: "2 · Equipment" }),
  page("screens/welcome/setup/sources.md", { title: "Sources", nav: "1 · Sources" }),
  page("screens/settings/README.md", { title: "Settings", routes: ["/settings"] }),
  page("screens/settings/discount-codes.md", {
    title: "Discount codes",
    routes: ["/settings/discount-codes"],
  }),
]

const labels = (nodes: NavNode[]): unknown[] =>
  nodes.map((n) => (n.children.length ? [n.label, labels(n.children)] : n.label))

describe("folderNav", () => {
  it("guides: the overview, then the root's pages in the order its README links them", () => {
    expect(labels(folderNav(PAGES, "README.md"))).toEqual([
      "Overview",
      "Getting started",
      "Mock data",
    ])
  })
})

describe("screensNav", () => {
  it("mirrors the panel navigation, nests by folder and marks what isn't built", () => {
    const nav = screensNav(PAGES, [
      { label: "Welcome", href: "/welcome", icon: "star" },
      { label: "Dashboard", href: "/dashboard", comingSoon: true },
      {
        label: "Settings",
        href: "/settings",
        children: [
          { label: "Users", href: "/settings/users", comingSoon: true },
          { label: "Discount codes", href: "/settings/discount-codes" },
        ],
      },
    ])
    expect(labels(nav)).toEqual([
      "Overview",
      "Panel shell",
      [
        "Welcome",
        [
          ["Setup wizard", ["1 · Sources", "2 · Equipment"]],
          "Mock data and states",
          "Backend (suggestion)",
        ],
      ],
      "Dashboard",
      ["Settings", ["Users", "Discount codes"]],
      "Booking page",
    ])
    expect(nav[2]).toMatchObject({ href: "/docs/screens/welcome", icon: "star" })
    expect(nav[3]).toMatchObject({ soon: true })
    expect(nav[3]?.href).toBeUndefined()
    expect(nav[4]?.children[1]).toMatchObject({ href: "/docs/screens/settings/discount-codes" })
  })
})
