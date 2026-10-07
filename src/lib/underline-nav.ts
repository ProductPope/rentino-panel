export const underlineNavList =
  "flex w-full items-end gap-1 overflow-x-auto border-b border-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"

export const underlineNavItem =
  "group/nav-item relative inline-flex h-10 shrink-0 items-center gap-1.5 px-3 text-label whitespace-nowrap text-muted-foreground transition-colors duration-(--eq-duration-fast) outline-none select-none hover:text-foreground focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 after:absolute after:inset-x-0 after:-bottom-px after:h-(--eq-tabs-indicator-height) after:rounded-full after:bg-primary-text after:opacity-0 after:transition-opacity [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"

/** Active state: `data-active` (Tabs) or `aria-current="page"` (SectionNav). */
export const underlineNavItemActive =
  "data-active:text-primary-text data-active:after:opacity-100 aria-[current=page]:text-primary-text aria-[current=page]:after:opacity-100"

/** Count pill inside an underline nav item. */
export const underlineNavCount =
  "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 font-mono text-caption text-muted-foreground group-data-active/nav-item:bg-primary-subtle group-data-active/nav-item:text-primary-text group-aria-[current=page]/nav-item:bg-primary-subtle group-aria-[current=page]/nav-item:text-primary-text"
