import type { AuditEntry, AuditLog } from "@/lib/audit-log"

import { persisted } from "./scenario"

const store = persisted<AuditEntry[]>("rentino.mock.audit-log", () => [])

export const mockAuditLog: AuditLog = {
  async record(entry) {
    store.write([{ ...entry, at: new Date().toISOString() }, ...store.read()])
  },
  async list() {
    return store.read()
  },
}
