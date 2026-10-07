"use client"

import {
  BanknoteIcon,
  CircleAlertIcon,
  InfoIcon,
  PlusIcon,
  Trash2Icon,
  ZapIcon,
} from "lucide-react"
import { useId } from "react"
import type * as React from "react"

import { DateRangePicker } from "@/components/eq/date-range-picker"
import { EditPanelSection } from "@/components/eq/edit-panel"
import { FormField } from "@/components/eq/form-field"
import { IconButton } from "@/components/eq/icon-button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  emptyPackage,
  emptyRule,
  emptyTier,
  RATE_KINDS,
  TIER_UNIT,
  WEEKDAYS,
  type PricingDraft,
  type PricingErrors,
  type RateKind,
  type RuleDraft,
  type TierDraft,
  type TierKind,
} from "@/lib/onboarding"
import { isoDate, tenant } from "@/lib/tenant"

const DATE_TYPES = [
  { value: "range", label: "Date range" },
  { value: "weekdays", label: "Days of the week" },
]
const CHANGES = [
  { value: "percent", label: "Percent" },
  { value: "fixed", label: "Fixed amount" },
]

/** The rate kind a field error belongs to (`daily.0.price` → daily), to open its tab. */
export function kindOfError(path: string): RateKind | "rules" | undefined {
  const head = path.split(".")[0]
  if (head === "rules") return "rules"
  return RATE_KINDS.find((k) => k.kind === head)?.kind
}

const countOf = (d: PricingDraft, kind: RateKind) =>
  kind === "nightly" ? (d.nightly.trim() ? 1 : 0) : d[kind].length

/**
 * Rental rates (one tab per kind, as in the Rentino equipment form) and dynamic pricing rules.
 * Controlled: the panel owns the draft, the errors and the open tab.
 */
export function PricingEditor({
  value,
  onChange,
  errors,
  tab,
  onTabChange,
  revealed = { rates: 0, rules: 0 },
}: {
  value: PricingDraft
  onChange: (next: PricingDraft) => void
  errors: PricingErrors
  tab: RateKind
  onTabChange: (tab: RateKind) => void
  /**
   * Both sections start collapsed. Each count bumps when a save finds errors there: the section
   * re-mounts open, so focus can reach the field.
   */
  revealed?: { rates: number; rules: number }
}) {
  const set = (patch: Partial<PricingDraft>) => onChange({ ...value, ...patch })
  const hasErrors = (kind: RateKind) => Object.keys(errors).some((k) => kindOfError(k) === kind)

  return (
    <>
      <EditPanelSection
        key={`rates-${revealed.rates}`}
        defaultOpen={revealed.rates > 0}
        title="Rental rates"
        icon={<BanknoteIcon aria-hidden="true" />}
      >
        <div className="flex flex-col gap-4">
          {errors.rates && <FieldError>{errors.rates}</FieldError>}
          <Tabs value={tab} onValueChange={(v) => onTabChange(v as RateKind)}>
            <TabsList
              variant="line"
              aria-label="Rate types"
              className="flex-wrap justify-start group-data-horizontal/tabs:h-auto"
            >
              {RATE_KINDS.map(({ kind, label }) => {
                const count = countOf(value, kind)
                return (
                  <TabsTrigger key={kind} value={kind} className="flex-none">
                    {label}
                    {count > 0 && (
                      <span className="font-mono text-caption text-muted-foreground">
                        <span aria-hidden="true">({count})</span>
                        <span className="sr-only">, {count} set</span>
                      </span>
                    )}
                    {hasErrors(kind) && (
                      <>
                        <CircleAlertIcon aria-hidden="true" className="text-destructive-text" />
                        <span className="sr-only">, has errors</span>
                      </>
                    )}
                  </TabsTrigger>
                )
              })}
            </TabsList>
            {(["hourly", "daily", "weekly", "monthly"] as TierKind[]).map((kind) => (
              <TabsContent key={kind} value={kind} className="pt-4">
                <TierRows
                  kind={kind}
                  tiers={value[kind]}
                  errors={errors}
                  onChange={(tiers) => set({ [kind]: tiers })}
                />
              </TabsContent>
            ))}
            <TabsContent value="packages" className="pt-4">
              <PackageRows value={value} errors={errors} onChange={set} />
            </TabsContent>
            <TabsContent value="nightly" className="pt-4">
              <div className="max-w-56">
                <MoneyField
                  label="Price per night"
                  description="Optional. Leave empty if you don't rent overnight."
                  value={value.nightly}
                  error={errors.nightly}
                  onChange={(nightly) => set({ nightly })}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </EditPanelSection>

      <EditPanelSection
        key={`rules-${revealed.rules}`}
        defaultOpen={revealed.rules > 0}
        title="Dynamic pricing"
        icon={<ZapIcon aria-hidden="true" />}
      >
        <div className="flex flex-col gap-4">
          <p className="text-body text-muted-foreground">
            Raise or lower prices on chosen dates — a season, holidays, weekends.
          </p>
          {value.rules.length > 0 && (
            <ol aria-label="Price rules" className="flex flex-col gap-3">
              {value.rules.map((rule, i) => (
                <RuleRow
                  key={rule.id}
                  index={i}
                  rule={rule}
                  errors={errors}
                  onChange={(next) =>
                    set({ rules: value.rules.map((r) => (r.id === rule.id ? next : r)) })
                  }
                  onRemove={() => set({ rules: value.rules.filter((r) => r.id !== rule.id) })}
                />
              ))}
            </ol>
          )}
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => set({ rules: [...value.rules, emptyRule()] })}
            >
              <PlusIcon data-icon="inline-start" aria-hidden="true" />
              Add a rule
            </Button>
          </div>
          <Alert variant="info">
            <InfoIcon aria-hidden="true" />
            <AlertDescription>
              <p>Rules add up before the final price.</p>
              <p>
                For example: +20% and a −30% discount on the same day take 10% off the regular price
                that day.
              </p>
            </AlertDescription>
          </Alert>
        </div>
      </EditPanelSection>
    </>
  )
}

function TierRows({
  kind,
  tiers,
  errors,
  onChange,
}: {
  kind: TierKind
  tiers: TierDraft[]
  errors: PricingErrors
  onChange: (tiers: TierDraft[]) => void
}) {
  const unit = TIER_UNIT[kind]
  const label = RATE_KINDS.find((k) => k.kind === kind)?.label ?? ""
  const update = (id: string, patch: Partial<TierDraft>) =>
    onChange(tiers.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  const add = () => {
    const last = tiers.at(-1)
    const next = last?.to.trim() && /^\d+$/.test(last.to.trim()) ? String(Number(last.to) + 1) : ""
    onChange([...tiers, emptyTier(tiers.length === 0 ? "1" : next)])
  }

  return (
    <div className="flex flex-col gap-3">
      {tiers.length === 0 ? (
        <p className="text-body text-muted-foreground">
          No {label.toLowerCase()} prices. Add a range if you rent by the {unit.singular}.
        </p>
      ) : (
        <ol aria-label={`${label} ranges`} className="flex flex-col gap-3">
          {tiers.map((tier, i) => (
            <li
              key={tier.id}
              aria-label={`Range ${i + 1}`}
              className="grid items-start gap-3 rounded-md border border-border bg-card p-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
            >
              <NumberField
                label={`${unit.label} from`}
                value={tier.from}
                error={errors[`${kind}.${i}.from`]}
                onChange={(from) => update(tier.id, { from })}
              />
              <NumberField
                label={`${unit.label} to`}
                placeholder="and more"
                value={tier.to}
                error={errors[`${kind}.${i}.to`]}
                onChange={(to) => update(tier.id, { to })}
              />
              <MoneyField
                label={`Price per ${unit.singular}`}
                value={tier.price}
                error={errors[`${kind}.${i}.price`]}
                onChange={(price) => update(tier.id, { price })}
              />
              <IconButton
                label={`Delete range ${i + 1}`}
                variant="ghost"
                className="sm:mt-6"
                icon={<Trash2Icon aria-hidden="true" />}
                onClick={() => onChange(tiers.filter((t) => t.id !== tier.id))}
              />
            </li>
          ))}
        </ol>
      )}
      <div>
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <PlusIcon data-icon="inline-start" aria-hidden="true" />
          Add a range
        </Button>
      </div>
    </div>
  )
}

function PackageRows({
  value,
  errors,
  onChange,
}: {
  value: PricingDraft
  errors: PricingErrors
  onChange: (patch: Partial<PricingDraft>) => void
}) {
  const { packages } = value
  const update = (id: string, patch: Partial<(typeof packages)[number]>) =>
    onChange({ packages: packages.map((p) => (p.id === id ? { ...p, ...patch } : p)) })
  return (
    <div className="flex flex-col gap-3">
      {packages.length === 0 ? (
        <p className="text-body text-muted-foreground">
          No packages. Add one for a fixed price for a few hours, e.g. half a day.
        </p>
      ) : (
        <ol aria-label="Hourly packages" className="flex flex-col gap-3">
          {packages.map((pkg, i) => (
            <li
              key={pkg.id}
              aria-label={`Package ${i + 1}`}
              className="grid items-start gap-3 rounded-md border border-border bg-card p-3 sm:grid-cols-[1fr_1fr_auto]"
            >
              <NumberField
                label="Hours"
                value={pkg.hours}
                error={errors[`packages.${i}.hours`]}
                onChange={(hours) => update(pkg.id, { hours })}
              />
              <MoneyField
                label="Package price"
                value={pkg.price}
                error={errors[`packages.${i}.price`]}
                onChange={(price) => update(pkg.id, { price })}
              />
              <IconButton
                label={`Delete package ${i + 1}`}
                variant="ghost"
                className="sm:mt-6"
                icon={<Trash2Icon aria-hidden="true" />}
                onClick={() => onChange({ packages: packages.filter((p) => p.id !== pkg.id) })}
              />
            </li>
          ))}
        </ol>
      )}
      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange({ packages: [...packages, emptyPackage()] })}
        >
          <PlusIcon data-icon="inline-start" aria-hidden="true" />
          Add a package
        </Button>
      </div>
    </div>
  )
}

function RuleRow({
  index,
  rule,
  errors,
  onChange,
  onRemove,
}: {
  index: number
  rule: RuleDraft
  errors: PricingErrors
  onChange: (rule: RuleDraft) => void
  onRemove: () => void
}) {
  const uid = useId()
  const at = `rules.${index}`
  const set = (patch: Partial<RuleDraft>) => onChange({ ...rule, ...patch })
  const range =
    rule.from || rule.to
      ? {
          from: rule.from ? new Date(`${rule.from}T00:00:00`) : undefined,
          to: rule.to ? new Date(`${rule.to}T00:00:00`) : undefined,
        }
      : undefined

  return (
    <li
      aria-label={`Rule ${index + 1}`}
      className="flex flex-col gap-3 rounded-md border border-border bg-card p-3"
    >
      <div className="grid items-start gap-3 sm:grid-cols-3">
        <ChoiceField
          label="Date type"
          items={DATE_TYPES}
          value={rule.dateType}
          onChange={(dateType) => set({ dateType: dateType as RuleDraft["dateType"] })}
        />
        <ChoiceField
          label="Type of change"
          items={CHANGES}
          value={rule.change}
          onChange={(change) => set({ change: change as RuleDraft["change"] })}
        />
        <FormField
          label="Value"
          description="Negative for a discount, e.g. -15."
          error={errors[`${at}.value`]}
        >
          {(field) => (
            <InputGroup>
              <InputGroupInput
                {...field}
                inputMode="decimal"
                autoComplete="off"
                className="text-right font-mono tabular-nums"
                value={rule.value}
                onChange={(e) => set({ value: e.target.value })}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupText>{rule.change === "percent" ? "%" : tenant.currency}</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
          )}
        </FormField>
      </div>

      {rule.dateType === "range" ? (
        <FormField label="Dates" error={errors[`${at}.dates`]}>
          {(field) => (
            <DateRangePicker
              {...field}
              className="w-full max-w-xs"
              locale={tenant.locale}
              placeholder="Choose dates"
              value={range}
              onValueChange={(next) =>
                set({
                  from: next?.from ? isoDate(next.from) : undefined,
                  to: next?.to ? isoDate(next.to) : undefined,
                })
              }
            />
          )}
        </FormField>
      ) : (
        <fieldset className="flex flex-col gap-2">
          <legend id={`${uid}-days`} className="mb-2 text-label">
            Days
          </legend>
          <ToggleGroup
            multiple
            variant="outline"
            spacing={1}
            aria-labelledby={`${uid}-days`}
            aria-describedby={errors[`${at}.weekdays`] ? `${uid}-days-error` : undefined}
            className="flex-wrap"
            value={rule.weekdays.map(String)}
            onValueChange={(days) => set({ weekdays: days.map(Number) })}
          >
            {WEEKDAYS.map((d) => (
              <ToggleGroupItem key={d.day} value={String(d.day)} aria-label={d.long}>
                {d.short}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {errors[`${at}.weekdays`] && (
            <FieldError id={`${uid}-days-error`}>{errors[`${at}.weekdays`]}</FieldError>
          )}
        </fieldset>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
        <div className="flex items-center gap-2">
          <Switch
            id={`${uid}-active`}
            checked={rule.active}
            onCheckedChange={(active) => set({ active })}
          />
          <Label htmlFor={`${uid}-active`}>Active</Label>
        </div>
        <IconButton
          label={`Delete rule ${index + 1}`}
          variant="ghost"
          icon={<Trash2Icon aria-hidden="true" />}
          onClick={onRemove}
        />
      </div>
    </li>
  )
}

function ChoiceField({
  label,
  items,
  value,
  onChange,
}: {
  label: string
  items: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <FormField label={label}>
      {(field) => (
        <Select items={items} value={value} onValueChange={(v) => onChange(String(v))}>
          <SelectTrigger className="w-full" {...field}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </FormField>
  )
}

function NumberField({
  label,
  placeholder,
  value,
  error,
  onChange,
}: {
  label: string
  placeholder?: string
  value: string
  error?: string
  onChange: (value: string) => void
}) {
  return (
    <FormField label={label} error={error}>
      {(field) => (
        <InputGroup>
          <InputGroupInput
            {...field}
            inputMode="numeric"
            autoComplete="off"
            placeholder={placeholder}
            className="font-mono tabular-nums"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </InputGroup>
      )}
    </FormField>
  )
}

export function MoneyField({
  label,
  description,
  value,
  error,
  onChange,
}: {
  label: string
  description?: React.ReactNode
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
            inputMode="decimal"
            autoComplete="off"
            className="text-right font-mono tabular-nums"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupText>{tenant.currency}</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
      )}
    </FormField>
  )
}
