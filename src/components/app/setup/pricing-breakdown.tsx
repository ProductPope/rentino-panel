import {
  RATE_KINDS,
  rateCount,
  ruleSummary,
  tierRange,
  TIER_UNIT,
  type Pricing,
  type TierKind,
} from "@/lib/onboarding"
import { formatMoney } from "@/lib/tenant"
import { cn } from "@/lib/utils"

const TIER_KINDS: TierKind[] = ["hourly", "daily", "weekly", "monthly"]

/** An item's price list, read-only: each rate kind it has, then its price rules. */
export function PricingBreakdown({ pricing }: { pricing: Pricing }) {
  const kinds = RATE_KINDS.filter((k) => rateCount(pricing, k.kind) > 0)
  return (
    <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
      {kinds.map(({ kind, label }) => (
        <section key={kind} aria-label={label} className="flex flex-col gap-1">
          <h3 className="text-caption font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </h3>
          <ul className="flex flex-col gap-0.5 text-body">
            {TIER_KINDS.includes(kind as TierKind) &&
              pricing[kind as TierKind].map((tier) => (
                <Line key={tier.id} label={tierRange(kind as TierKind, tier)}>
                  {formatMoney(tier.price)} / {TIER_UNIT[kind as TierKind].singular}
                </Line>
              ))}
            {kind === "packages" &&
              pricing.packages.map((pkg) => (
                <Line key={pkg.id} label={`${pkg.hours} ${pkg.hours === 1 ? "hour" : "hours"}`}>
                  {formatMoney(pkg.price)}
                </Line>
              ))}
            {kind === "nightly" && pricing.nightly != null && (
              <Line label="Night">{formatMoney(pricing.nightly)}</Line>
            )}
          </ul>
        </section>
      ))}
      {pricing.rules.length > 0 && (
        <section aria-label="Price rules" className="flex flex-col gap-1">
          <h3 className="text-caption font-medium tracking-wide text-muted-foreground uppercase">
            Price rules
          </h3>
          <ul className="flex flex-col gap-0.5 text-body">
            {pricing.rules.map((rule) => (
              <li
                key={rule.id}
                className={cn(rule.active ? "text-foreground" : "text-muted-foreground")}
              >
                {ruleSummary(rule)}
                {!rule.active && " (off)"}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <li className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-foreground tabular-nums">{children}</span>
    </li>
  )
}
