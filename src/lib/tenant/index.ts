/**
 * Tenant settings that shape formatting. Mocked: there is no backend; one place to change them.
 */
export interface TenantSettings {
  currency: string
  locale: string
}

export const tenant: TenantSettings = { currency: "USD", locale: "en-US" }

export function formatMoney(amount: number, settings: TenantSettings = tenant) {
  return new Intl.NumberFormat(settings.locale, {
    style: "currency",
    currency: settings.currency,
  }).format(amount)
}

/** A date as `YYYY-MM-DD` in local time — the format of every date-only field. */
export function isoDate(now: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function formatDate(isoDate: string, settings: TenantSettings = tenant) {
  return new Intl.DateTimeFormat(settings.locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${isoDate}T00:00:00`))
}

/** Today as `YYYY-MM-DD` in local time. */
export const today = () => isoDate(new Date())
