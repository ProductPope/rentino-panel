import { createCn } from "cn/config"

/**
 * Typography roles from @eq/tokens (`text-page-title`, …). They are font-size utilities; without
 * registering them, cn() treats unknown `text-*` classes as colours and drops one of
 * `text-page-title text-muted-foreground`. Keep in sync with packages/tokens/src/semantic/typography.json.
 */
export const TYPOGRAPHY_ROLES = ["page-title", "section-title", "body", "label", "caption"] as const

/** Merge class names (clsx + Tailwind conflict resolution) with EQ theme extensions. */
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [{ text: [...TYPOGRAPHY_ROLES] }],
    },
  },
})
