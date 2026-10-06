import {
  DiscountCodeError,
  type DiscountCode,
  type DiscountCodeInput,
  type DiscountCodeRepository,
} from "@/lib/discount-codes/types"
import { isDuplicateCode } from "@/lib/discount-codes/validation"
import { isoDate } from "@/lib/tenant"

import { mockAuditLog } from "./audit-log"
import { delay, mockScenario, persisted } from "./scenario"

/** Demo actor for audit entries (the mock session's user). */
const ACTOR = "Anna Nowak"

/** Date `days` from today, so the demo statuses stay the same whenever it runs. */
function inDays(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return isoDate(date)
}

function seed(): DiscountCode[] {
  const at = new Date().toISOString()
  const base = { createdAt: at, updatedAt: at }
  return [
    {
      id: "dc-1",
      code: "WINTERSALE",
      type: "percentage",
      value: 10,
      validFrom: inDays(-5),
      validTo: inDays(145),
      active: true,
      description: "Winter campaign",
      uses: 42,
      ...base,
    },
    {
      id: "dc-2",
      code: "WELCOME50",
      type: "fixed",
      value: 50,
      active: true,
      description: "New clients",
      uses: 128,
      ...base,
    },
    {
      id: "dc-3",
      code: "BLACKFRIDAY",
      type: "percentage",
      value: 25,
      validFrom: inDays(52),
      validTo: inDays(55),
      active: true,
      uses: 0,
      ...base,
    },
    {
      id: "dc-4",
      code: "SUMMER15",
      type: "percentage",
      value: 15,
      validFrom: inDays(-127),
      validTo: inDays(-36),
      active: true,
      uses: 311,
      ...base,
    },
    {
      id: "dc-5",
      code: "PARTNER_HOTEL",
      type: "fixed",
      value: 20,
      active: false,
      description: "Concierge partner — paused",
      uses: 9,
      ...base,
    },
    {
      id: "dc-6",
      code: "SPRING-2027",
      type: "percentage",
      value: 12.5,
      validFrom: inDays(160),
      active: true,
      uses: 0,
      ...base,
    },
    {
      id: "dc-7",
      code: "KAYAK5",
      type: "fixed",
      value: 5,
      validFrom: inDays(200),
      validTo: inDays(290),
      active: false,
      description: "Draft for the kayak season",
      uses: 0,
      ...base,
    },
  ]
}

const store = persisted<DiscountCode[]>("rentino.mock.discount-codes", seed)

function find(id: string) {
  const code = store.read().find((c) => c.id === id)
  if (!code)
    throw new DiscountCodeError("not_found", "This code no longer exists. Reload the list.")
  return code
}

function assertUnique(input: DiscountCodeInput, ownId?: string) {
  if (isDuplicateCode(input.code, store.read(), ownId))
    throw new DiscountCodeError(
      "duplicate_code",
      `A code “${input.code}” already exists. Choose another one.`
    )
}

/** Optional fields set to `undefined` are removed, so JSON storage matches what came in. */
const clean = <T extends object>(value: T) =>
  Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T

export const mockDiscountCodeRepository: DiscountCodeRepository = {
  async list() {
    const scenario = mockScenario()
    if (scenario === "reset") store.reset()
    await delay()
    if (scenario === "error")
      throw new DiscountCodeError("unavailable", "The server didn't respond. Try again.")
    if (scenario === "empty") return []
    return store.read()
  },

  async create(input) {
    await delay()
    assertUnique(input)
    const at = new Date().toISOString()
    const created = clean<DiscountCode>({
      ...input,
      id: `dc-${crypto.randomUUID()}`,
      uses: 0,
      createdAt: at,
      updatedAt: at,
    })
    store.write([created, ...store.read()])
    await mockAuditLog.record({
      actor: ACTOR,
      action: "Created",
      subject: `Discount code ${created.code}`,
    })
    return created
  },

  async update(id, input) {
    await delay()
    const current = find(id)
    assertUnique(input, id)
    if (current.uses > 0 && input.code !== current.code)
      throw new DiscountCodeError(
        "in_use",
        `${current.code} was used on ${current.uses} orders, so its code can't change.`
      )
    const updated = clean<DiscountCode>({
      ...input,
      id,
      uses: current.uses,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    })
    store.write(store.read().map((c) => (c.id === id ? updated : c)))
    await mockAuditLog.record({
      actor: ACTOR,
      action: "Edited",
      subject: `Discount code ${updated.code}`,
    })
    return updated
  },

  async setActive(id, active) {
    await delay()
    const updated = { ...find(id), active, updatedAt: new Date().toISOString() }
    store.write(store.read().map((c) => (c.id === id ? updated : c)))
    await mockAuditLog.record({
      actor: ACTOR,
      action: active ? "Activated" : "Deactivated",
      subject: `Discount code ${updated.code}`,
    })
    return updated
  },

  async remove(id) {
    await delay()
    const code = find(id)
    if (code.uses > 0)
      throw new DiscountCodeError(
        "in_use",
        `${code.code} was used on ${code.uses} orders, so it can only be deactivated.`
      )
    store.write(store.read().filter((c) => c.id !== id))
    await mockAuditLog.record({
      actor: ACTOR,
      action: "Deleted",
      subject: `Discount code ${code.code}`,
    })
  },
}
