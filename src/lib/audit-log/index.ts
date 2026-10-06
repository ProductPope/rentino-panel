import { mockAuditLog } from "@/mocks/audit-log"

/** Settings → Logs entries. Code changes are recorded here (WHLZ-566 §5). */
export interface AuditEntry {
  at: string
  actor: string
  action: string
  /** The object the action was on, e.g. "Discount code WINTERSALE". */
  subject: string
}

export interface AuditLog {
  record(entry: Omit<AuditEntry, "at">): Promise<void>
  list(): Promise<AuditEntry[]>
}

/** The audit log the app uses. Swap the mock for a real implementation here. */
export const auditLog: AuditLog = mockAuditLog
