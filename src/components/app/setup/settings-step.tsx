"use client"

import { ArrowRightIcon, CheckIcon, TriangleAlertIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useId, useRef, useState } from "react"
import type * as React from "react"

import { FormField } from "@/components/eq/form-field"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/sonner"
import { Switch } from "@/components/ui/switch"
import { SETUP_START_HREF, WELCOME_HREF } from "@/config/navigation"
import {
  onboardingService,
  toSettings,
  toSettingsDraft,
  validateSettings,
  vatLabel,
  type OnboardingStatus,
  type SettingsDraft,
} from "@/lib/onboarding"
import { tenant } from "@/lib/tenant"

import { EquipmentFirst } from "./equipment-first"

type Load = { state: "loading" } | { state: "error" } | { state: "ready"; status: OnboardingStatus }

/**
 * Setup step 4: rental terms. Everything is suggested for the customer; only the VAT rate needs
 * their decision. Errors show at the fields on save; focus moves to the first one.
 */
export function SettingsStep() {
  const [load, setLoad] = useState<Load>({ state: "loading" })

  useEffect(() => {
    onboardingService
      .getStatus()
      .then((status) => setLoad({ state: "ready", status }))
      .catch(() => setLoad({ state: "error" }))
  }, [])

  const intro = (
    <div className="flex flex-col gap-2">
      <h1 className="text-page-title text-foreground">Your rental settings</h1>
      <p className="text-body text-muted-foreground">
        Your equipment and prices are in the system. We suggested rental terms for you — only the
        highlighted item needs your decision.
      </p>
    </div>
  )

  if (load.state === "loading")
    return (
      <>
        {intro}
        <div aria-busy="true" className="flex flex-col gap-4">
          <span className="sr-only">Loading your settings…</span>
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </>
    )

  if (load.state === "error")
    return (
      <>
        {intro}
        <Alert variant="destructive" announce="assertive">
          <TriangleAlertIcon aria-hidden="true" />
          <AlertTitle>Your settings couldn&apos;t be loaded</AlertTitle>
          <AlertDescription>Reload the page to try again.</AlertDescription>
        </Alert>
      </>
    )

  if (load.status.stage !== "imported")
    return (
      <>
        {intro}
        <EquipmentFirst what="Rental settings" />
      </>
    )

  return (
    <>
      {intro}
      <SettingsForm status={load.status} />
    </>
  )
}

function SettingsForm({ status }: { status: OnboardingStatus }) {
  const router = useRouter()
  const uid = useId()
  const formRef = useRef<HTMLFormElement>(null)
  const [draft, setDraft] = useState<SettingsDraft>(() => toSettingsDraft(status.settings))
  const [showErrors, setShowErrors] = useState(false)
  const [saving, setSaving] = useState(false)

  const errors = showErrors ? validateSettings(draft) : {}
  const update = (patch: Partial<SettingsDraft>) => setDraft((d) => ({ ...d, ...patch }))
  const { settings } = status

  async function save(event: React.FormEvent) {
    event.preventDefault()
    if (Object.keys(validateSettings(draft)).length > 0) {
      setShowErrors(true)
      requestAnimationFrame(() =>
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      )
      return
    }
    setSaving(true)
    try {
      await onboardingService.saveSettings(toSettings(draft, settings))
      toast.success("Your rental settings are saved")
      router.push(SETUP_START_HREF)
    } catch (err) {
      setSaving(false)
      toast.error(err instanceof Error ? err.message : "We couldn't save. Try again.")
    }
  }

  return (
    <form
      ref={formRef}
      noValidate
      aria-label="Rental settings"
      onSubmit={(e) => void save(e)}
      className="flex flex-col gap-4"
    >
      <Tile title="Payments" badge={<Suggested />}>
        <Choice
          legend="How do your customers pay?"
          value={draft.payMode}
          onChange={(payMode) => update({ payMode })}
          options={[
            { value: "full", label: "Full payment online" },
            { value: "deposit", label: "Deposit, the rest later" },
          ]}
        />
        {draft.payMode === "deposit" && (
          <div className="flex flex-wrap items-start gap-x-6 gap-y-4 *:w-48">
            <NumberField
              label="Deposit at booking"
              suffix="%"
              value={draft.depositPercent}
              error={errors.depositPercent}
              onChange={(depositPercent) => update({ depositPercent })}
            />
            <NumberField
              label="Charge the rest"
              suffix="days before pickup"
              value={draft.restDaysBefore}
              error={errors.restDaysBefore}
              onChange={(restDaysBefore) => update({ restDaysBefore })}
            />
          </div>
        )}
      </Tile>

      <Tile title="Delivery" badge={<Suggested />}>
        <Choice
          legend="Do you deliver equipment to your customers?"
          value={draft.delivery ? "yes" : "no"}
          onChange={(value) => update({ delivery: value === "yes" })}
          options={[
            { value: "yes", label: "Yes, we deliver" },
            { value: "no", label: "No, pickup only" },
          ]}
        />
        {draft.delivery && (
          <div className="flex flex-wrap items-start gap-x-6 gap-y-4 *:w-48">
            <NumberField
              label="Free from"
              suffix="rental days"
              value={draft.freeFromDays}
              error={errors.freeFromDays}
              onChange={(freeFromDays) => update({ freeFromDays })}
            />
            <NumberField
              label="Flat fee"
              suffix={tenant.currency}
              decimal
              value={draft.deliveryFee}
              error={errors.deliveryFee}
              onChange={(deliveryFee) => update({ deliveryFee })}
            />
            <NumberField
              label="Or per km"
              description="Optional"
              suffix={`${tenant.currency} / km`}
              decimal
              placeholder="Not used"
              value={draft.perKmFee}
              error={errors.perKmFee}
              onChange={(perKmFee) => update({ perKmFee })}
            />
          </div>
        )}
      </Tile>

      <Tile
        title="Taxes and fees"
        highlighted={!draft.vatConfirmed}
        badge={
          draft.vatConfirmed ? (
            <Badge variant="success">
              <CheckIcon data-icon="inline-start" aria-hidden="true" />
              Confirmed
            </Badge>
          ) : (
            <Badge variant="warning">
              <TriangleAlertIcon data-icon="inline-start" aria-hidden="true" />
              Needs confirmation
            </Badge>
          )
        }
      >
        <div className="flex flex-wrap justify-between gap-x-4 text-body">
          <span className="font-medium text-foreground">VAT</span>
          <span className="text-foreground">{vatLabel(settings)}</span>
        </div>
        <Field orientation="horizontal" data-invalid={errors.vatConfirmed ? true : undefined}>
          <Checkbox
            id={`${uid}-vat`}
            checked={draft.vatConfirmed}
            onCheckedChange={(vatConfirmed) => update({ vatConfirmed })}
            aria-invalid={errors.vatConfirmed ? true : undefined}
            aria-describedby={`${uid}-vat-help${errors.vatConfirmed ? ` ${uid}-vat-error` : ""}`}
          />
          <FieldContent>
            <FieldLabel htmlFor={`${uid}-vat`}>
              I confirm my rentals are subject to {settings.vatRate}% VAT
            </FieldLabel>
            <FieldDescription id={`${uid}-vat-help`}>
              We set the rate from your business address. You&apos;re responsible for tax settings,
              so we always ask.
            </FieldDescription>
            {errors.vatConfirmed && (
              <FieldError id={`${uid}-vat-error`}>{errors.vatConfirmed}</FieldError>
            )}
          </FieldContent>
        </Field>
        <Separator />
        {draft.cardFee ? (
          <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
            <div className="w-48">
              <NumberField
                label="Card payment fee"
                suffix="%"
                decimal
                value={draft.cardFeePercent}
                error={errors.cardFeePercent}
                onChange={(cardFeePercent) => update({ cardFeePercent })}
              />
            </div>
            <Button
              type="button"
              variant="link"
              onClick={() => update({ cardFee: false, cardFeePercent: "" })}
            >
              Remove the fee
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-x-4 text-body">
            <span className="font-medium text-foreground">Card payment fee</span>
            <span className="flex items-center gap-2 text-muted-foreground">
              None
              <span aria-hidden="true">·</span>
              <Button
                type="button"
                variant="link"
                className="h-auto px-0"
                onClick={() => update({ cardFee: true })}
              >
                Add a fee
              </Button>
            </span>
          </div>
        )}
      </Tile>

      <Tile title="Booking page" badge={<Suggested />}>
        <div className="flex flex-col gap-0.5 text-body">
          <span className="font-medium text-foreground">Rental terms</span>
          <span className="text-muted-foreground">
            Rentino standard rental terms. You can upload your own later in Settings.
          </span>
        </div>
        <Separator />
        <Field orientation="horizontal">
          <FieldContent>
            <Label htmlFor={`${uid}-signature`}>Customer signature at booking</Label>
            <FieldDescription id={`${uid}-signature-help`}>
              Recommended: signed terms protect you in disputes about damage.
            </FieldDescription>
          </FieldContent>
          <Switch
            id={`${uid}-signature`}
            aria-describedby={`${uid}-signature-help`}
            checked={draft.signatureRequired}
            onCheckedChange={(signatureRequired) => update({ signatureRequired })}
          />
        </Field>
      </Tile>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-5">
        <p className="mr-auto text-body text-muted-foreground">
          You can change everything later in Settings.
        </p>
        <Link href={WELCOME_HREF} className={buttonVariants({ variant: "outline" })}>
          I&apos;ll finish later
        </Link>
        <Button type="submit" loading={saving} disabled={saving}>
          Save and continue
          <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
        </Button>
      </div>
    </form>
  )
}

function Tile({
  title,
  badge,
  highlighted,
  children,
}: {
  title: string
  badge?: React.ReactNode
  highlighted?: boolean
  children: React.ReactNode
}) {
  const id = useId()
  return (
    <Card
      role="region"
      aria-labelledby={id}
      data-highlighted={highlighted ? "" : undefined}
      className="data-highlighted:ring-2 data-highlighted:ring-warning"
    >
      <CardContent className="gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id={id} className="text-section-title text-foreground">
            {title}
          </h2>
          {badge}
        </div>
        {children}
      </CardContent>
    </Card>
  )
}

const Suggested = () => <Badge variant="secondary">Suggested</Badge>

/** A setting with a few exclusive answers: a radio group of choice cards, side by side. */
function Choice<T extends string>({
  legend,
  value,
  onChange,
  options,
}: {
  legend: string
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
}) {
  const uid = useId()
  return (
    <FieldSet>
      <FieldLegend variant="label">{legend}</FieldLegend>
      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as T)}
        className="grid gap-3 sm:grid-cols-2"
      >
        {options.map((option) => (
          <FieldLabel key={option.value} htmlFor={`${uid}-${option.value}`}>
            <Field orientation="horizontal">
              <RadioGroupItem value={option.value} id={`${uid}-${option.value}`} />
              <FieldTitle>{option.label}</FieldTitle>
            </Field>
          </FieldLabel>
        ))}
      </RadioGroup>
    </FieldSet>
  )
}

function NumberField({
  label,
  description,
  suffix,
  decimal,
  placeholder,
  value,
  error,
  onChange,
}: {
  label: string
  description?: string
  suffix: string
  decimal?: boolean
  placeholder?: string
  value: string
  error?: string
  onChange: (value: string) => void
}) {
  return (
    <FormField label={label} description={description} error={error}>
      {(field) => (
        <InputGroup>
          <InputGroupInput
            {...field}
            inputMode={decimal ? "decimal" : "numeric"}
            autoComplete="off"
            placeholder={placeholder}
            className="text-right font-mono tabular-nums"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupText>{suffix}</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
      )}
    </FormField>
  )
}
