import { describe, expect, it } from "vitest"

import {
  headingId,
  hrefOfSlug,
  parseFrontMatter,
  resolvePath,
  rewriteHref,
  slugOfFile,
  titleOf,
} from "./paths"

describe("routes of docs files", () => {
  it("README is the folder's page", () => {
    expect(slugOfFile("README.md")).toEqual([])
    expect(slugOfFile("screens/README.md")).toEqual(["screens"])
    expect(slugOfFile("screens/welcome.md")).toEqual(["screens", "welcome"])
    expect(hrefOfSlug([])).toBe("/docs")
    expect(hrefOfSlug(["screens", "welcome"])).toBe("/docs/screens/welcome")
  })

  it("resolves relative paths, also out of docs/", () => {
    expect(resolvePath("screens/welcome.md", "./setup-1-sources.md")).toBe(
      "screens/setup-1-sources.md"
    )
    expect(resolvePath("screens/welcome.md", "../img/a.jpg")).toBe("img/a.jpg")
    expect(resolvePath("README.md", "../CLAUDE.md")).toBe("../CLAUDE.md")
    expect(resolvePath("screens/welcome.md", "../../README.md")).toBe("../README.md")
  })
})

describe("rewriteHref", () => {
  it("keeps web links and anchors", () => {
    expect(rewriteHref("README.md", "https://eq-librium.vercel.app")).toBe(
      "https://eq-librium.vercel.app"
    )
    expect(rewriteHref("README.md", "#adding-a-screen")).toBe("#adding-a-screen")
  })

  it("points docs to their routes, images to /docs/img, the rest to GitHub", () => {
    expect(rewriteHref("README.md", "./screens/README.md")).toBe("/docs/screens")
    expect(rewriteHref("screens/welcome.md", "../mock-data.md#demo-users")).toBe(
      "/docs/mock-data#demo-users"
    )
    expect(rewriteHref("screens/welcome.md", "../img/welcome-a.jpg")).toBe(
      "/docs/img/welcome-a.jpg"
    )
    expect(rewriteHref("README.md", "../CLAUDE.md")).toBe(
      "https://github.com/ProductPope/rentino-panel/blob/main/CLAUDE.md"
    )
    expect(rewriteHref("screens/README.md", "./_template.md")).toBe("/docs/screens/_template")
  })
})

describe("headings and front matter", () => {
  it("makes GitHub-style anchors", () => {
    expect(headingId("Keeping the docs current")).toBe("keeping-the-docs-current")
    expect(headingId("Demo users: the `mock_user` cookie")).toBe("demo-users-the-mock_user-cookie")
    expect(headingId("Setup 3 — Equipment and prices")).toBe("setup-3--equipment-and-prices")
  })

  it("reads front matter and the title", () => {
    const source =
      "---\ntitle: Welcome\nroutes: [/welcome]\nstatus: prototype # note\n---\n\n# Welcome page\n"
    expect(parseFrontMatter(source).data).toEqual({
      title: "Welcome",
      routes: "[/welcome]",
      status: "prototype",
    })
    expect(parseFrontMatter(source).body).toBe("\n# Welcome page\n")
    expect(titleOf("x.md", "# Mock data\n\ntext")).toBe("Mock data")
    expect(titleOf("x.md", "no heading")).toBe("x.md")
  })
})
