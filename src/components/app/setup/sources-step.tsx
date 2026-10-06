"use client"

import { ArrowRightIcon, FileSpreadsheetIcon, FileTextIcon, GlobeIcon, XIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useId, useRef, useState } from "react"

import { FormField } from "@/components/eq/form-field"
import { IconButton } from "@/components/eq/icon-button"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/sonner"
import { SETUP_PROGRESS_HREF } from "@/config/navigation"
import { formatFileSize, onboardingService, sourcesError, type SourceKind } from "@/lib/onboarding"

const SOURCES: { kind: SourceKind; title: string; description: string; icon: React.ReactNode }[] = [
  {
    kind: "website",
    title: "Website address",
    description: "You have a website with your offer and prices.",
    icon: <GlobeIcon aria-hidden="true" />,
  },
  {
    kind: "file",
    title: "Price list file",
    description: "PDF, Excel, CSV or a photo of the price list on your wall.",
    icon: <FileSpreadsheetIcon aria-hidden="true" />,
  },
]

const ACCEPT = ".pdf,.xls,.xlsx,.csv,image/jpeg,image/png,image/heic"

/** Setup step 1: where we get the customer's equipment and prices from. */
export function SourcesStep() {
  const router = useRouter()
  const uid = useId()
  const [kind, setKind] = useState<SourceKind>("website")
  const [website, setWebsite] = useState("")
  const [file, setFile] = useState<{ name: string; size: number }>()
  const [showErrors, setShowErrors] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const fieldRef = useRef<HTMLInputElement>(null)

  const error = sourcesError(kind, website, file?.name)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (error) {
      setShowErrors(true)
      fieldRef.current?.focus()
      return
    }
    setSubmitting(true)
    try {
      await onboardingService.submitSources(
        kind === "website" ? { kind, website } : { kind, fileName: file?.name ?? "" }
      )
      router.push(SETUP_PROGRESS_HREF)
    } catch {
      setSubmitting(false)
      toast.error("We couldn't send it. Try again.")
    }
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="text-page-title text-foreground">We&apos;ll set up your system for you</h1>
        <p className="text-body text-muted-foreground">
          Send us your website or price list. We&apos;ll add your equipment, prices and rental terms
          — meanwhile, try the system on demo data.
        </p>
      </div>

      <form noValidate onSubmit={(e) => void submit(e)} className="flex flex-col gap-6">
        <FieldSet>
          <FieldLegend variant="label">Where should we get your equipment and prices?</FieldLegend>
          <RadioGroup
            value={kind}
            onValueChange={(value) => {
              setKind(value as SourceKind)
              setShowErrors(false)
            }}
          >
            {SOURCES.map((source) => (
              <FieldLabel key={source.kind} htmlFor={`${uid}-${source.kind}`}>
                <Field orientation="horizontal">
                  <RadioGroupItem value={source.kind} id={`${uid}-${source.kind}`} />
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground [&>svg]:size-4">
                    {source.icon}
                  </span>
                  <FieldContent>
                    <FieldTitle>{source.title}</FieldTitle>
                    <FieldDescription>{source.description}</FieldDescription>
                  </FieldContent>
                </Field>
              </FieldLabel>
            ))}
          </RadioGroup>
        </FieldSet>

        {kind === "website" ? (
          <FormField
            label="Your website"
            description="We'll read categories, photos and prices. We won't change anything on your website."
            error={showErrors ? error : undefined}
            required
          >
            {(control) => (
              <Input
                {...control}
                ref={fieldRef}
                inputMode="url"
                autoComplete="url"
                placeholder="e.g. bikesmallorca.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            )}
          </FormField>
        ) : file ? (
          <div className="flex items-center gap-3 rounded-md border border-border px-3 py-2">
            <FileTextIcon aria-hidden="true" className="size-4 shrink-0 text-primary-text" />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-label text-foreground">{file.name}</span>
              <span className="text-caption text-muted-foreground">
                {formatFileSize(file.size)}
              </span>
            </div>
            <IconButton
              label="Remove file"
              size="sm"
              variant="ghost"
              icon={<XIcon aria-hidden="true" />}
              onClick={() => setFile(undefined)}
            />
          </div>
        ) : (
          <FormField
            label="Your price list"
            description="PDF, Excel, CSV or a photo of the price list (JPG, PNG)."
            error={showErrors ? error : undefined}
            required
          >
            {(control) => (
              <Input
                {...control}
                ref={fieldRef}
                type="file"
                accept={ACCEPT}
                onChange={(e) => {
                  const chosen = e.target.files?.[0]
                  if (chosen) setFile({ name: chosen.name, size: chosen.size })
                }}
              />
            )}
          </FormField>
        )}

        <div className="flex justify-end border-t border-border pt-5">
          <Button type="submit" disabled={submitting}>
            {submitting && <Spinner data-icon="inline-start" aria-label="Sending" />}
            Set up my system
            <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
          </Button>
        </div>
      </form>
    </>
  )
}
