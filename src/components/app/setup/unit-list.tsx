"use client"

import { ChevronDownIcon, ImageIcon, RotateCcwIcon, XIcon } from "lucide-react"
import { useId, useState } from "react"

import { FormField } from "@/components/eq/form-field"
import { IconButton } from "@/components/eq/icon-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  NAME_MAX_LENGTH,
  normalizeUnitCode,
  UNIT_CODE_MAX_LENGTH,
  type EquipmentErrors,
  type Unit,
  type UnitOverrideDraft,
} from "@/lib/onboarding"
import { cn } from "@/lib/utils"

/** How many units show before "Show all". */
const PAGE = 10

/**
 * The units of an item, each with an optional own code, name and photo. A unit without its own
 * photo shows the equipment photo. Units with errors open by themselves.
 */
export function UnitList({
  units,
  overrides,
  errors,
  onChange,
  onPhoto,
}: {
  units: Unit[]
  overrides: UnitOverrideDraft[]
  errors: EquipmentErrors
  onChange: (overrides: UnitOverrideDraft[]) => void
  /** Reads a picked photo (size checks included); resolves to a data URL or an error. */
  onPhoto: (file: File) => Promise<{ url?: string; error?: string }>
}) {
  const [open, setOpen] = useState<Set<number>>(new Set())
  const [showAll, setShowAll] = useState(false)
  const withErrors = new Set(
    Object.keys(errors)
      .filter((k) => k.startsWith("unit."))
      .map((k) => Number(k.split(".")[1]))
  )
  const all = showAll || [...withErrors].some((p) => p > PAGE)
  const shown = all ? units : units.slice(0, PAGE)

  const override = (position: number) =>
    overrides.find((o) => o.position === position) ?? { position, code: "", name: "" }
  const set = (position: number, patch: Partial<UnitOverrideDraft>) => {
    const next = { ...override(position), ...patch }
    onChange([...overrides.filter((o) => o.position !== position), next])
  }
  const reset = (position: number) => onChange(overrides.filter((o) => o.position !== position))
  const toggle = (position: number) =>
    setOpen((s) => {
      const next = new Set(s)
      if (next.has(position)) next.delete(position)
      else next.add(position)
      return next
    })

  if (units.length === 0) return null
  return (
    <div className="flex flex-col gap-3">
      <ol aria-label="Units" className="flex flex-col gap-2">
        {shown.map((unit) => (
          <UnitRow
            key={unit.position}
            unit={unit}
            draft={override(unit.position)}
            errors={errors}
            expanded={open.has(unit.position) || withErrors.has(unit.position)}
            onToggle={() => toggle(unit.position)}
            onChange={(patch) => set(unit.position, patch)}
            onReset={() => reset(unit.position)}
            onPhoto={onPhoto}
          />
        ))}
      </ol>
      {!all && units.length > PAGE && (
        <div>
          <Button type="button" variant="outline" size="sm" onClick={() => setShowAll(true)}>
            Show all {units.length} units
          </Button>
        </div>
      )}
    </div>
  )
}

function UnitRow({
  unit,
  draft,
  errors,
  expanded,
  onToggle,
  onChange,
  onReset,
  onPhoto,
}: {
  unit: Unit
  draft: UnitOverrideDraft
  errors: EquipmentErrors
  expanded: boolean
  onToggle: () => void
  onChange: (patch: Partial<UnitOverrideDraft>) => void
  onReset: () => void
  onPhoto: (file: File) => Promise<{ url?: string; error?: string }>
}) {
  const id = useId()
  const [photoError, setPhotoError] = useState<string>()
  const at = `unit.${unit.position}`
  const own = [unit.ownCode && "own code", unit.ownName && "own name", unit.ownPhoto && "own photo"]
    .filter(Boolean)
    .join(" · ")

  return (
    <li
      aria-label={`Unit ${unit.code}`}
      className="flex flex-col gap-3 rounded-md border border-border bg-card p-3"
    >
      <div className="flex items-center gap-3">
        {unit.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- a data URL or a local demo photo
          <img
            src={unit.photoUrl}
            alt=""
            className={cn(
              "size-10 shrink-0 rounded-md bg-white object-contain",
              !unit.ownPhoto && "opacity-70"
            )}
          />
        ) : (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-dashed border-input text-muted-foreground">
            <ImageIcon aria-hidden="true" className="size-4" />
          </span>
        )}
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-mono text-label break-all text-foreground">{unit.code}</span>
          <span className="text-caption break-words text-muted-foreground">
            {unit.name}
            {own ? ` · ${own}` : ""}
          </span>
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-expanded={expanded}
          aria-controls={`${id}-fields`}
          onClick={onToggle}
        >
          Edit
          <span className="sr-only"> unit {unit.code}</span>
          <ChevronDownIcon
            data-icon="inline-end"
            aria-hidden="true"
            className={cn("transition-transform", expanded && "rotate-180")}
          />
        </Button>
      </div>

      {expanded && (
        <div id={`${id}-fields`} className="grid gap-3 border-t border-border pt-3 sm:grid-cols-2">
          <FormField
            label="Unit code"
            description={`Default ${unit.defaultCode}. Use a serial or frame number if you like.`}
            error={errors[`${at}.code`]}
          >
            {(field) => (
              <Input
                {...field}
                autoComplete="off"
                spellCheck={false}
                maxLength={UNIT_CODE_MAX_LENGTH}
                placeholder={unit.defaultCode}
                className="font-mono uppercase"
                value={draft.code}
                onChange={(e) => onChange({ code: normalizeUnitCode(e.target.value) })}
              />
            )}
          </FormField>
          <FormField
            label="Unit name"
            description="Optional, e.g. “Size L, red”."
            error={errors[`${at}.name`]}
          >
            {(field) => (
              <Input
                {...field}
                autoComplete="off"
                maxLength={NAME_MAX_LENGTH}
                placeholder={unit.ownName ? undefined : unit.name}
                value={draft.name}
                onChange={(e) => onChange({ name: e.target.value })}
              />
            )}
          </FormField>
          <div className="sm:col-span-2">
            {draft.photoUrl ? (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- a data URL */}
                <img
                  src={draft.photoUrl}
                  alt=""
                  className="size-12 rounded-md bg-white object-contain"
                />
                <span className="flex-1 text-body text-muted-foreground">Unit photo added</span>
                <IconButton
                  label={`Remove the photo of ${unit.code}`}
                  size="sm"
                  variant="ghost"
                  icon={<XIcon aria-hidden="true" />}
                  onClick={() => onChange({ photoUrl: undefined })}
                />
              </div>
            ) : (
              <FormField
                label="Unit photo"
                description="Optional. Without it, the unit shows the equipment photo."
                error={photoError}
              >
                {(field) => (
                  <Input
                    {...field}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const result = await onPhoto(file)
                      setPhotoError(result.error)
                      if (result.url) onChange({ photoUrl: result.url })
                    }}
                  />
                )}
              </FormField>
            )}
          </div>
          {(unit.ownCode || unit.ownName || unit.ownPhoto) && (
            <div className="sm:col-span-2">
              <Button type="button" variant="link" size="sm" className="px-0" onClick={onReset}>
                <RotateCcwIcon data-icon="inline-start" aria-hidden="true" />
                Use the equipment&apos;s details for {unit.code}
              </Button>
            </div>
          )}
        </div>
      )}
    </li>
  )
}
