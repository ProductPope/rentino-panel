"use client"

import { ImageIcon, PackageIcon, XIcon } from "lucide-react"
import { useRef, useState } from "react"

import { EditPanel, EditPanelFields, EditPanelSection } from "@/components/eq/edit-panel"
import { FormField } from "@/components/eq/form-field"
import { IconButton } from "@/components/eq/icon-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/sonner"
import {
  EQUIPMENT_CATEGORIES,
  NAME_MAX_LENGTH,
  normalizePrefix,
  onboardingService,
  PREFIX_MAX_LENGTH,
  prefixFor,
  toEquipmentDraft,
  toEquipmentInput,
  validateEquipment,
  type EquipmentDraft,
  type EquipmentItem,
  type PricingDraft,
  type RateKind,
} from "@/lib/onboarding"

import { kindOfError, PricingEditor } from "./pricing-editor"

/** The tab to open first: daily if the item has daily prices, else the first kind it has. */
function firstTab(pricing: PricingDraft): RateKind {
  if (pricing.daily.length > 0) return "daily"
  const kinds: RateKind[] = ["hourly", "packages", "weekly", "monthly"]
  return (
    kinds.find((k) => (pricing[k] as unknown[]).length > 0) ??
    (pricing.nightly ? "nightly" : "daily")
  )
}

/** Photos are kept in the browser (no backend), so they stay small. */
const PHOTO_MAX_BYTES = 1024 * 1024
const CATEGORY_ITEMS = EQUIPMENT_CATEGORIES.map((c) => ({ value: c.label, label: c.label }))

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

/**
 * Add or edit one equipment item in the EditPanel. Errors show after the first save, then update
 * as you type; focus moves to the first invalid field. "Save and add another" keeps the panel open.
 */
export function EquipmentPanel({
  open,
  onOpenChange,
  item,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The item to edit; `undefined` adds a new one. Re-mount (key) the panel per opening. */
  item?: EquipmentItem
  onSaved: (item: EquipmentItem, added: boolean) => void
}) {
  const [draft, setDraft] = useState<EquipmentDraft>(() => toEquipmentDraft(item))
  const [showErrors, setShowErrors] = useState(false)
  const [photoError, setPhotoError] = useState<string>()
  const [saving, setSaving] = useState<"stay" | "close" | null>(null)
  const [tab, setTab] = useState<RateKind>(() => firstTab(draft.pricing))
  const formRef = useRef<HTMLFormElement>(null)

  const errors = showErrors ? validateEquipment(draft) : {}
  const update = (patch: Partial<EquipmentDraft>) => setDraft((d) => ({ ...d, ...patch }))

  async function save(stay: boolean) {
    const problems = Object.keys(validateEquipment(draft))
    if (problems.length > 0) {
      setShowErrors(true)
      // An error in a closed rate tab: open that tab so focus can reach the field.
      const kind = problems.map(kindOfError).find((k) => k && k !== "rules")
      if (kind && kind !== "rules") setTab(kind)
      requestAnimationFrame(() =>
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      )
      return
    }
    setSaving(stay ? "stay" : "close")
    try {
      const input = toEquipmentInput(draft)
      // Editing an example makes it the customer's own item: it is saved on approve.
      const saved = item
        ? await onboardingService.putEquipment({ ...item, ...input, demo: false })
        : await onboardingService.addEquipment(input)
      onSaved(saved, !item)
      if (stay) {
        toast.success(`Added ${saved.name}`)
        setDraft(toEquipmentDraft())
        setTab("daily")
        setShowErrors(false)
        requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>("input")?.focus())
      } else {
        onOpenChange(false)
      }
    } catch {
      toast.error("We couldn't save it. Try again.")
    } finally {
      setSaving(null)
    }
  }

  async function choosePhoto(file: File | undefined) {
    setPhotoError(undefined)
    if (!file) return
    if (file.size > PHOTO_MAX_BYTES) {
      setPhotoError("Choose a photo under 1 MB.")
      return
    }
    update({ photoUrl: await readAsDataUrl(file) })
  }

  const title = item ? `Edit ${item.name}` : "Add equipment"
  return (
    <EditPanel
      open={open}
      defaultSize="half"
      onOpenChange={(next) => {
        if (!saving) onOpenChange(next)
      }}
      title={title}
      description={
        item?.demo
          ? "This is a demo example. Saving it makes it your own item."
          : "One kind of equipment; each unit gets its own code."
      }
      footer={
        <>
          {!item && (
            <Button
              variant="outline"
              loading={saving === "stay"}
              disabled={saving !== null}
              onClick={() => void save(true)}
            >
              Save and add another
            </Button>
          )}
          <Button
            loading={saving === "close"}
            disabled={saving !== null}
            onClick={() => void save(false)}
          >
            {item ? "Save" : "Add equipment"}
          </Button>
        </>
      }
    >
      <form
        ref={formRef}
        noValidate
        aria-label={title}
        className="contents"
        onSubmit={(event) => {
          event.preventDefault()
          void save(false)
        }}
      >
        <EditPanelSection title="Equipment" icon={<PackageIcon aria-hidden="true" />}>
          <EditPanelFields>
            <FormField label="Name" required error={errors.name}>
              {(field) => (
                <Input
                  {...field}
                  autoComplete="off"
                  maxLength={NAME_MAX_LENGTH}
                  placeholder="e.g. Trek Marlin 7"
                  value={draft.name}
                  onChange={(e) => update({ name: e.target.value })}
                />
              )}
            </FormField>

            <FormField label="Category" required error={errors.category}>
              {(field) => (
                <Select
                  items={CATEGORY_ITEMS}
                  value={draft.category || null}
                  onValueChange={(value) => {
                    const category = String(value ?? "")
                    setDraft((d) => ({
                      ...d,
                      category,
                      // Follow the category until the customer types their own prefix.
                      codePrefix:
                        !d.codePrefix || d.codePrefix === prefixFor(d.category)
                          ? prefixFor(category)
                          : d.codePrefix,
                    }))
                  }}
                >
                  <SelectTrigger className="w-full" {...field}>
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_ITEMS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>

            <FormField
              label="Number of units"
              required
              description="How many of it you rent out."
              error={errors.units}
            >
              {(field) => (
                <Input
                  {...field}
                  inputMode="numeric"
                  autoComplete="off"
                  className="max-w-32 font-mono"
                  value={draft.units}
                  onChange={(e) => update({ units: e.target.value.trim() })}
                />
              )}
            </FormField>

            <FormField
              label="Code"
              required
              description={
                draft.codePrefix.length >= 2
                  ? `Units get codes ${draft.codePrefix}-001, ${draft.codePrefix}-002, …`
                  : "Units get codes like BIK-001. Letters and digits."
              }
              error={errors.codePrefix}
            >
              {(field) => (
                <Input
                  {...field}
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={PREFIX_MAX_LENGTH}
                  className="max-w-32 font-mono uppercase"
                  value={draft.codePrefix}
                  onChange={(e) => update({ codePrefix: normalizePrefix(e.target.value) })}
                />
              )}
            </FormField>

            {draft.photoUrl ? (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- a data URL or a local demo photo */}
                <img
                  src={draft.photoUrl}
                  alt=""
                  className="size-16 rounded-md bg-white object-contain"
                />
                <span className="flex-1 text-body text-muted-foreground">Photo added</span>
                <IconButton
                  label="Remove photo"
                  size="sm"
                  variant="ghost"
                  icon={<XIcon aria-hidden="true" />}
                  onClick={() => update({ photoUrl: undefined })}
                />
              </div>
            ) : (
              <FormField
                label="Photo"
                description="Optional. JPG or PNG, up to 1 MB."
                error={photoError}
              >
                {(field) => (
                  <Input
                    {...field}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => void choosePhoto(e.target.files?.[0])}
                  />
                )}
              </FormField>
            )}
          </EditPanelFields>
        </EditPanelSection>

        <PricingEditor
          value={draft.pricing}
          onChange={(pricing) => update({ pricing })}
          errors={errors}
          tab={tab}
          onTabChange={setTab}
        />
      </form>
    </EditPanel>
  )
}

export function EquipmentThumbnail({ item }: { item: Pick<EquipmentItem, "photoUrl"> }) {
  return item.photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element -- a data URL or a local demo photo
    <img
      src={item.photoUrl}
      alt=""
      className="size-14 shrink-0 rounded-md bg-white object-contain"
    />
  ) : (
    <span className="flex size-14 shrink-0 items-center justify-center rounded-md border border-dashed border-input text-muted-foreground">
      <ImageIcon aria-hidden="true" className="size-5" />
    </span>
  )
}
