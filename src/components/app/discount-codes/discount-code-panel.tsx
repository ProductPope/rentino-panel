"use client"

import { CalendarRangeIcon, NotebookPenIcon, TicketPercentIcon } from "lucide-react"
import { useId, useRef, useState } from "react"

import { DateRangePicker, type DateRange } from "@/components/eq/date-range-picker"
import { EditPanel, EditPanelFields, EditPanelSection } from "@/components/eq/edit-panel"
import { FormField } from "@/components/eq/form-field"
import { Button } from "@/components/ui/button"
import { FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/components/ui/sonner"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  CODE_MAX_LENGTH,
  discountCodeRepository,
  DiscountCodeError,
  normalizeCode,
  toDraft,
  toInput,
  TYPE_LABEL,
  validateDiscountCode,
  type DiscountCode,
  type DiscountCodeDraft,
  type DiscountCodeErrors,
  type DiscountType,
} from "@/lib/discount-codes"
import { isoDate, tenant } from "@/lib/tenant"

const toRange = (draft: DiscountCodeDraft): DateRange | undefined =>
  draft.validFrom
    ? {
        from: new Date(`${draft.validFrom}T00:00:00`),
        to: draft.validTo ? new Date(`${draft.validTo}T00:00:00`) : undefined,
      }
    : undefined

/**
 * Add or edit a discount code in the EditPanel (WHLZ-566). Errors appear after the first save, then
 * update as you type; focus moves to the first invalid field. "Save and stay" keeps the panel open.
 */
export function DiscountCodePanel({
  open,
  onOpenChange,
  code: initial,
  existing,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The code to edit; `undefined` adds a new one. Re-mount (key) the panel per opening. */
  code?: DiscountCode
  /** All codes, for the uniqueness check as you type. */
  existing: DiscountCode[]
  onSaved: (code: DiscountCode, created: boolean) => void
}) {
  const uid = useId()
  const formRef = useRef<HTMLFormElement>(null)
  // After "Save and stay" on a new code the panel goes on editing what was saved.
  const [code, setCode] = useState(initial)
  const [draft, setDraft] = useState<DiscountCodeDraft>(() => toDraft(initial))
  const [submitted, setSubmitted] = useState(false)
  const [serverErrors, setServerErrors] = useState<DiscountCodeErrors>({})
  const [saving, setSaving] = useState<"stay" | "close" | null>(null)

  const used = (code?.uses ?? 0) > 0
  const errors: DiscountCodeErrors = submitted
    ? { ...serverErrors, ...validateDiscountCode(draft, existing, code?.id) }
    : {}

  const update = (patch: Partial<DiscountCodeDraft>) => {
    setDraft((d) => ({ ...d, ...patch }))
    setServerErrors({})
  }

  const focusFirstError = () =>
    requestAnimationFrame(() =>
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
    )

  async function save(stay: boolean) {
    setSubmitted(true)
    setServerErrors({})
    if (Object.keys(validateDiscountCode(draft, existing, code?.id)).length) {
      focusFirstError()
      return
    }
    setSaving(stay ? "stay" : "close")
    try {
      const input = toInput(draft)
      const saved = code
        ? await discountCodeRepository.update(code.id, input)
        : await discountCodeRepository.create(input)
      onSaved(saved, !code)
      toast.success(`Code ${saved.code} ${code ? "saved" : "created"}`)
      if (stay) {
        setCode(saved)
        setDraft(toDraft(saved))
        setSubmitted(false)
      } else {
        onOpenChange(false)
      }
    } catch (err) {
      if (
        err instanceof DiscountCodeError &&
        (err.reason === "duplicate_code" || err.reason === "in_use")
      ) {
        setServerErrors({ code: err.message })
        focusFirstError()
      } else {
        toast.error(`Couldn't save ${normalizeCode(draft.code) || "the code"}`, {
          description:
            err instanceof Error && err.message ? err.message : "Something went wrong. Try again.",
        })
      }
    } finally {
      setSaving(null)
    }
  }

  return (
    <EditPanel
      open={open}
      onOpenChange={(next) => {
        if (!saving) onOpenChange(next)
      }}
      title={code ? `Edit code ${code.code}` : "Add code"}
      description={
        code
          ? used
            ? `Used on ${code.uses} ${code.uses === 1 ? "order" : "orders"}.`
            : "Not used on any order yet."
          : "Clients enter it at checkout; you can add it to an order."
      }
      footer={
        <>
          <Button
            variant="outline"
            loading={saving === "stay"}
            disabled={saving !== null}
            onClick={() => void save(true)}
          >
            Save and stay
          </Button>
          <Button
            loading={saving === "close"}
            disabled={saving !== null}
            onClick={() => void save(false)}
          >
            Save
          </Button>
        </>
      }
    >
      <form
        ref={formRef}
        noValidate
        aria-label={code ? `Edit code ${code.code}` : "Add code"}
        className="contents"
        onSubmit={(event) => {
          event.preventDefault()
          void save(false)
        }}
      >
        <EditPanelSection title="Code" icon={<TicketPercentIcon aria-hidden="true" />}>
          <EditPanelFields>
            <FormField
              label="Code"
              required
              description={
                used
                  ? "Clients already used this code, so it can't change. Add a new code instead."
                  : "Clients type it at checkout. Letters A–Z, digits, “-” and “_”; saved in capitals."
              }
              error={errors.code}
            >
              {(field) => (
                <Input
                  {...field}
                  className="font-mono uppercase"
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={CODE_MAX_LENGTH}
                  readOnly={used}
                  value={draft.code}
                  onChange={(e) => update({ code: normalizeCode(e.target.value) })}
                />
              )}
            </FormField>

            <fieldset className="flex flex-col gap-3">
              <legend className="mb-3 text-label">Type</legend>
              <RadioGroup
                value={draft.type}
                onValueChange={(v) => update({ type: v as DiscountType })}
                className="flex flex-wrap gap-x-6 gap-y-3"
              >
                {(Object.keys(TYPE_LABEL) as DiscountType[]).map((type) => (
                  <div key={type} className="flex items-center gap-2">
                    <RadioGroupItem value={type} id={`${uid}-type-${type}`} />
                    <FieldLabel htmlFor={`${uid}-type-${type}`}>{TYPE_LABEL[type]}</FieldLabel>
                  </div>
                ))}
              </RadioGroup>
            </fieldset>

            <FormField
              label="Value"
              required
              description={
                draft.type === "percentage"
                  ? "Between 0.01 and 100. Applies to rental items, before transport and tax."
                  : `In ${tenant.currency}. Never more than the rental items total.`
              }
              error={errors.value}
            >
              {(field) => (
                <InputGroup className="max-w-48">
                  <InputGroupInput
                    {...field}
                    inputMode="decimal"
                    autoComplete="off"
                    className="font-mono"
                    value={draft.value}
                    onChange={(e) => update({ value: e.target.value })}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>
                      {draft.type === "percentage" ? "%" : tenant.currency}
                    </InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
              )}
            </FormField>
          </EditPanelFields>
        </EditPanelSection>

        <EditPanelSection title="Validity" icon={<CalendarRangeIcon aria-hidden="true" />}>
          <EditPanelFields>
            <FormField
              label="Valid"
              description="Optional. Pick a start date, or a start and an end date. Without dates the code never expires."
              error={errors.validity}
            >
              {(field) => (
                <DateRangePicker
                  {...field}
                  className="w-full max-w-xs"
                  locale={tenant.locale}
                  placeholder="Always"
                  value={toRange(draft)}
                  onValueChange={(range) =>
                    update({
                      validFrom: range?.from ? isoDate(range.from) : undefined,
                      validTo: range?.to ? isoDate(range.to) : undefined,
                    })
                  }
                />
              )}
            </FormField>

            <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
              <div className="flex flex-col gap-1">
                <Label htmlFor={`${uid}-active`}>Active</Label>
                <p id={`${uid}-active-help`} className="text-caption text-muted-foreground">
                  Inactive codes are rejected at checkout. Used codes can only be deactivated, not
                  deleted.
                </p>
              </div>
              <Switch
                id={`${uid}-active`}
                aria-describedby={`${uid}-active-help`}
                checked={draft.active}
                onCheckedChange={(active) => update({ active })}
              />
            </div>
          </EditPanelFields>
        </EditPanelSection>

        <EditPanelSection title="Internal note" icon={<NotebookPenIcon aria-hidden="true" />}>
          <FormField label="Note" description="Only your team sees this.">
            {(field) => (
              <Textarea
                {...field}
                rows={3}
                value={draft.description}
                onChange={(e) => update({ description: e.target.value })}
              />
            )}
          </FormField>
        </EditPanelSection>
      </form>
    </EditPanel>
  )
}
