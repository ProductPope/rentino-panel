/** How an equipment item shows on the customer's booking page (the online shop). */

/** Languages a description can be written in; the booking page shows the visitor's one. */
export const BOOKING_LANGUAGES = [
  { code: "en", label: "EN", name: "English" },
  { code: "pl", label: "PL", name: "Polish" },
  { code: "es", label: "ES", name: "Spanish" },
  { code: "de", label: "DE", name: "German" },
  { code: "fr", label: "FR", name: "French" },
  { code: "nl", label: "NL", name: "Dutch" },
  { code: "pt", label: "PT", name: "Portuguese" },
  { code: "it", label: "IT", name: "Italian" },
  { code: "sv", label: "SV", name: "Swedish" },
  { code: "ar", label: "AR", name: "Arabic", dir: "rtl" },
  { code: "sr", label: "SR", name: "Serbian" },
] as const

export type BookingLanguage = (typeof BOOKING_LANGUAGES)[number]["code"]

export const SLUG_MAX_LENGTH = 60
export const DESCRIPTION_MAX_LENGTH = 2000

/** A field the customer defined once and reuses on many items (managed in Settings). */
export interface CustomField {
  id: string
  label: string
}

/** The custom fields of the account: shown with the description, or asked for at checkout. */
export interface CustomFields {
  description: CustomField[]
  checkout: CustomField[]
}

export interface OnlineBooking {
  /** Shown on the booking page. Hidden items can still be booked in the panel. */
  visible: boolean
  /** The end of the item's address: https://{domain}/product/{slug} */
  slug: string
  descriptions: Partial<Record<BookingLanguage, string>>
  /** Custom field ids shown with the description, e.g. frame size. */
  descriptionFields: string[]
  /** Custom field ids asked for when booking, e.g. rider height. */
  checkoutFields: string[]
}

export interface OnlineBookingDraft {
  visible: boolean
  slug: string
  descriptions: Partial<Record<BookingLanguage, string>>
  descriptionFields: string[]
  checkoutFields: string[]
}

const plain = (value: string) => value.normalize("NFKD").replace(/[̀-ͯ]/g, "")

/** "Trek Marlin 7 – 29\"" → "trek-marlin-7-29". */
export function slugify(name: string) {
  return plain(name)
    .toLowerCase()
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/-+$/, "")
}

/** While typing: lowercase letters, digits and "-" only. */
export const normalizeSlug = (value: string) =>
  plain(value)
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, SLUG_MAX_LENGTH)

/** The default unit code: the first five letters or digits of the name ("Trek Marlin" → TREKM). */
export const prefixFromName = (name: string) =>
  plain(name)
    .toUpperCase()
    .replace(/Ł/g, "L")
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 5)

export function toOnlineDraft(online: OnlineBooking | undefined, name: string): OnlineBookingDraft {
  return {
    visible: online?.visible ?? true,
    slug: online?.slug ?? slugify(name),
    descriptions: { ...online?.descriptions },
    descriptionFields: [...(online?.descriptionFields ?? [])],
    checkoutFields: [...(online?.checkoutFields ?? [])],
  }
}

export function validateOnline(
  draft: OnlineBookingDraft,
  takenSlugs: Set<string> = new Set()
): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!draft.slug) errors["online.slug"] = "Enter the end of the address, e.g. city-bike."
  else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(draft.slug))
    errors["online.slug"] = "Use lowercase letters and digits, with single “-” between words."
  else if (takenSlugs.has(draft.slug))
    errors["online.slug"] = `Another item uses “${draft.slug}”. Addresses must be unique.`
  for (const { code, name } of BOOKING_LANGUAGES)
    if ((draft.descriptions[code] ?? "").length > DESCRIPTION_MAX_LENGTH)
      errors[`online.description.${code}`] =
        `Shorten the ${name} description to ${DESCRIPTION_MAX_LENGTH} characters.`
  return errors
}

export function toOnline(draft: OnlineBookingDraft): OnlineBooking {
  const descriptions: OnlineBooking["descriptions"] = {}
  for (const { code } of BOOKING_LANGUAGES) {
    const text = draft.descriptions[code]?.trim()
    if (text) descriptions[code] = text
  }
  return {
    visible: draft.visible,
    slug: draft.slug,
    descriptions,
    descriptionFields: draft.descriptionFields,
    checkoutFields: draft.checkoutFields,
  }
}

/** Shown on the booking page unless the customer switched it off. */
export const isOnline = (item: { online?: Pick<OnlineBooking, "visible"> }) =>
  item.online?.visible !== false

/** The item's slug, or one made from its name (items saved before slugs existed). */
export const slugOf = (item: { name: string; online?: Pick<OnlineBooking, "slug"> }) =>
  item.online?.slug || slugify(item.name)

/** https://bikesmallorca.rentino.app/product/ */
export const productUrlBase = (domain: string) => `https://${domain}/product/`
