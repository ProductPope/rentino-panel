"use client"

import { CircleAlertIcon, ExternalLinkIcon, InfoIcon, PencilIcon } from "lucide-react"
import Link from "next/link"
import { useId, useState } from "react"

import { FormField } from "@/components/eq/form-field"
import { IconButton } from "@/components/eq/icon-button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import { Field, FieldContent, FieldDescription } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/sonner"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  BOOKING_LANGUAGES,
  DESCRIPTION_MAX_LENGTH,
  normalizeSlug,
  SLUG_MAX_LENGTH,
  type BookingLanguage,
  type CustomField,
  type CustomFields,
  type EquipmentErrors,
  type OnlineBookingDraft,
} from "@/lib/onboarding"

/**
 * "Other settings" of an item: whether it shows on the booking page, its address there, a
 * description per language, and which custom fields it shows and asks for at checkout.
 */
export function OnlineSettings({
  value,
  onChange,
  errors,
  urlBase,
  liveHref,
  customFields,
}: {
  value: OnlineBookingDraft
  onChange: (value: OnlineBookingDraft) => void
  errors: EquipmentErrors
  /** "https://bikesmallorca.rentino.app/product/" — unknown while the account loads. */
  urlBase?: string
  /** The item's live page; only for a saved item that is shown online. */
  liveHref?: string
  customFields?: CustomFields
}) {
  const uid = useId()
  const set = (patch: Partial<OnlineBookingDraft>) => onChange({ ...value, ...patch })
  const descriptionError = (code: BookingLanguage) => errors[`online.description.${code}`]
  // Opens on the first language with an error (the section re-mounts when a save finds one).
  const [language, setLanguage] = useState<BookingLanguage>(
    () => BOOKING_LANGUAGES.find((l) => descriptionError(l.code))?.code ?? "en"
  )

  return (
    // pt-2: room between the switch and the section heading (target size 2.5.8).
    <div className="flex flex-col gap-5 pt-2">
      <Field orientation="horizontal">
        <FieldContent>
          <Label htmlFor={`${uid}-visible`}>Show on your booking page</Label>
          <FieldDescription id={`${uid}-visible-help`}>
            {value.visible
              ? "Customers can find and book it online."
              : "Hidden online. You can still book it for customers in the panel."}
          </FieldDescription>
        </FieldContent>
        <Switch
          id={`${uid}-visible`}
          aria-describedby={`${uid}-visible-help`}
          checked={value.visible}
          onCheckedChange={(visible) => set({ visible })}
        />
      </Field>

      {value.visible && (
        <Alert variant="info">
          <InfoIcon aria-hidden="true" />
          <AlertDescription>
            It shows on your booking page once it has at least one unit and a rental rate, and only
            at the locations where its units are.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-2">
        <FormField
          label="Booking page address"
          description={
            <span className="break-all">
              {urlBase ? `${urlBase}${value.slug || "…"}` : "Lowercase letters, digits and “-”."}
            </span>
          }
          error={errors["online.slug"]}
        >
          {(field) => (
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText className="font-mono">/product/</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                {...field}
                autoComplete="off"
                spellCheck={false}
                maxLength={SLUG_MAX_LENGTH}
                className="font-mono"
                value={value.slug}
                onChange={(e) => set({ slug: normalizeSlug(e.target.value) })}
              />
            </InputGroup>
          )}
        </FormField>
        {liveHref && (
          <div>
            <Link
              href={liveHref}
              target="_blank"
              rel="noopener"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <ExternalLinkIcon data-icon="inline-start" aria-hidden="true" />
              See it live
              <span className="sr-only">(opens in a new tab)</span>
            </Link>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p id={`${uid}-description`} className="text-label text-foreground">
          Description
        </p>
        <Tabs value={language} onValueChange={(v) => setLanguage(v as BookingLanguage)}>
          <TabsList
            variant="line"
            aria-labelledby={`${uid}-description`}
            className="flex-wrap justify-start group-data-horizontal/tabs:h-auto"
          >
            {BOOKING_LANGUAGES.map(({ code, label, name }) => (
              <TabsTrigger key={code} value={code} className="flex-none">
                {label}
                <span className="sr-only">, {name}</span>
                {value.descriptions[code]?.trim() && (
                  <>
                    <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
                    <span className="sr-only">, written</span>
                  </>
                )}
                {descriptionError(code) && (
                  <>
                    <CircleAlertIcon aria-hidden="true" className="text-destructive-text" />
                    <span className="sr-only">, has errors</span>
                  </>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          {BOOKING_LANGUAGES.map((l) => (
            <TabsContent key={l.code} value={l.code} className="pt-3">
              <FormField
                label={`Description in ${l.name}`}
                description={
                  l.code === "en"
                    ? "Visitors see their language, or English when it's missing."
                    : `Optional. Without it, visitors see the English description.`
                }
                error={descriptionError(l.code)}
              >
                {(field) => (
                  <Textarea
                    {...field}
                    lang={l.code}
                    dir={"dir" in l ? l.dir : undefined}
                    rows={4}
                    maxLength={DESCRIPTION_MAX_LENGTH + 100}
                    value={value.descriptions[l.code] ?? ""}
                    onChange={(e) =>
                      set({ descriptions: { ...value.descriptions, [l.code]: e.target.value } })
                    }
                  />
                )}
              </FormField>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <div className="grid gap-4 @2xl:grid-cols-2">
        <FieldPicker
          label="Custom description fields"
          description="Details shown with the description, e.g. frame size."
          manageLabel="Manage custom description fields"
          options={customFields?.description}
          value={value.descriptionFields}
          onChange={(descriptionFields) => set({ descriptionFields })}
        />
        <FieldPicker
          label="Custom checkout fields"
          description="What customers fill in when they book it, e.g. rider height."
          manageLabel="Manage custom checkout fields"
          options={customFields?.checkout}
          value={value.checkoutFields}
          onChange={(checkoutFields) => set({ checkoutFields })}
        />
      </div>
    </div>
  )
}

/** Pick any number of the account's custom fields. */
function FieldPicker({
  label,
  description,
  manageLabel,
  options,
  value,
  onChange,
}: {
  label: string
  description: string
  manageLabel: string
  options?: CustomField[]
  value: string[]
  onChange: (value: string[]) => void
}) {
  const labelOf = (id: string) => options?.find((o) => o.id === id)?.label ?? id
  return (
    <div className="flex items-start gap-2">
      <div className="min-w-0 flex-1">
        <FormField label={label} description={description}>
          {(field) => (
            <Select
              multiple
              value={value}
              disabled={!options}
              onValueChange={(next) => onChange(next as string[])}
            >
              <SelectTrigger className="w-full" {...field}>
                <SelectValue>
                  {(selected: string[]) =>
                    selected.length > 0 ? selected.map(labelOf).join(", ") : "Choose…"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(options ?? []).map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>
      </div>
      <IconButton
        label={manageLabel}
        variant="ghost"
        className="mt-6"
        icon={<PencilIcon aria-hidden="true" />}
        onClick={() =>
          toast("Custom fields are managed in Settings", {
            description: "That section isn't in this prototype yet.",
          })
        }
      />
    </div>
  )
}
