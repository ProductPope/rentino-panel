import { describe, expect, it } from "vitest"

import { DiscountCodeError } from "@/lib/discount-codes/types"

import { mockAuditLog } from "./audit-log"
import { mockDiscountCodeRepository as repo } from "./discount-codes"

describe("mock discount code repository", () => {
  it("refuses to delete a used code and logs nothing", async () => {
    const used = (await repo.list()).find((c) => c.uses > 0)!
    await expect(repo.remove(used.id)).rejects.toMatchObject({ reason: "in_use" })
    await expect(repo.remove(used.id)).rejects.toBeInstanceOf(DiscountCodeError)
    expect(await mockAuditLog.list()).toEqual([])
  })

  it("deletes an unused code and records it in Logs", async () => {
    const unused = (await repo.list()).find((c) => c.uses === 0)!
    await repo.remove(unused.id)
    expect((await repo.list()).some((c) => c.id === unused.id)).toBe(false)
    expect((await mockAuditLog.list())[0]).toMatchObject({
      action: "Deleted",
      subject: `Discount code ${unused.code}`,
    })
  })

  it("deactivates and activates, recording each change", async () => {
    const code = (await repo.list()).find((c) => c.active)!
    expect((await repo.setActive(code.id, false)).active).toBe(false)
    expect((await repo.setActive(code.id, true)).active).toBe(true)
    const [last, previous] = await mockAuditLog.list()
    expect(previous?.action).toBe("Deactivated")
    expect(last?.action).toBe("Activated")
  })

  it("reports a missing code", async () => {
    await expect(repo.setActive("nope", true)).rejects.toMatchObject({ reason: "not_found" })
  })

  it("creates a code, unique case-insensitively, and records it", async () => {
    const input = { code: "AUTUMN10", type: "percentage" as const, value: 10, active: true }
    const created = await repo.create(input)
    expect(created).toMatchObject({ ...input, uses: 0 })
    expect((await repo.list())[0]?.id).toBe(created.id)
    expect((await mockAuditLog.list())[0]).toMatchObject({ action: "Created" })
    await expect(repo.create({ ...input, code: "WELCOME50" })).rejects.toMatchObject({
      reason: "duplicate_code",
    })
  })

  it("edits a code but never the text of a used one", async () => {
    const used = (await repo.list()).find((c) => c.code === "WELCOME50")!
    const edited = await repo.update(used.id, { ...used, value: 60, description: undefined })
    expect(edited).toMatchObject({ value: 60, uses: used.uses })
    expect(edited).not.toHaveProperty("description")
    expect((await mockAuditLog.list())[0]).toMatchObject({ action: "Edited" })
    await expect(repo.update(used.id, { ...used, code: "WELCOME60" })).rejects.toMatchObject({
      reason: "in_use",
    })
  })
})
