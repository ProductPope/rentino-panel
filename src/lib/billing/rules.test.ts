import { describe, expect, it } from "vitest"

import { annualTotal, monthlyPrice, planById, PLANS, showsTrial, trialStatus } from "./rules"

const plan = (id: "a" | "b" | "c" | "unlimited") => planById(id)!

describe("plan prices", () => {
  it("annual billing is 20% off, in whole dollars", () => {
    expect(PLANS.map((p) => monthlyPrice(p, "monthly"))).toEqual([49, 99, 199, null])
    expect(PLANS.map((p) => monthlyPrice(p, "annual"))).toEqual([39, 79, 159, null])
    expect(annualTotal(plan("b"))).toBe(948)
    expect(annualTotal(plan("unlimited"))).toBeNull()
  })

  it("exactly one plan is marked most popular", () => {
    expect(PLANS.filter((p) => p.popular).map((p) => p.id)).toEqual(["b"])
  })
})

describe("trialStatus", () => {
  const start = "2026-10-01T09:00:00.000Z"

  it("counts whole days left and the end date", () => {
    const status = trialStatus(
      { trialStartedAt: start, trialDays: 30 },
      new Date("2026-10-10T08:00:00Z")
    )
    expect(status).toMatchObject({ daysLeft: 22, daysTotal: 30, ended: false })
    expect(status.endsAt.toISOString()).toBe("2026-10-31T09:00:00.000Z")
  })

  it("never goes below zero; then the trial has ended", () => {
    expect(
      trialStatus({ trialStartedAt: start, trialDays: 30 }, new Date("2026-12-01"))
    ).toMatchObject({
      daysLeft: 0,
      ended: true,
    })
  })

  it("shows until a paid plan is chosen", () => {
    expect(showsTrial({ trialStartedAt: start, trialDays: 30 })).toBe(true)
    expect(
      showsTrial({ trialStartedAt: start, trialDays: 30, plan: { id: "b", period: "annual" } })
    ).toBe(false)
  })
})
