"use client"

import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible"
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export interface AppShellNavItem {
  label: string
  href: string
  /** A lucide icon element. Shown alone (with a tooltip) when the sidebar is collapsed. */
  icon: React.ReactNode
  /** A count next to the label, e.g. orders waiting for action. Hidden when collapsed. */
  badge?: number
  /** What the count means, for screen readers: "3 orders to confirm". Defaults to the number. */
  badgeLabel?: string
  /**
   * Sub-pages, shown indented under this item (Settings → General settings, Users, …). The item
   * then toggles the list instead of navigating; it opens by itself when a sub-page is current.
   */
  children?: AppShellNavSubItem[]
  /**
   * Not built yet: shown with a “Soon” badge, not a link, not focusable, read as
   * “…, coming soon”. Use it while an app is rolled out section by section.
   */
  comingSoon?: boolean
}

export interface AppShellNavSubItem {
  label: string
  href: string
  /** Optional lucide icon. */
  icon?: React.ReactNode
  /** Not built yet — see `AppShellNavItem.comingSoon`. */
  comingSoon?: boolean
}

/** What `renderLink` receives: any item or sub-item. */
export type AppShellLinkTarget = Pick<AppShellNavItem, "label" | "href">

export interface AppShellNavGroup {
  /** Group heading ("Sales", "Settings"). Omit for the first, ungrouped block. */
  label?: string
  items: AppShellNavItem[]
}

export interface AppShellProps {
  /** Logo and product name, top of the sidebar. */
  brand: React.ReactNode
  navigation: AppShellNavGroup[]
  /** `href` of the current page; its item gets `aria-current="page"`. */
  currentHref: string
  /** Accessible name of the navigation landmark. */
  navLabel?: string
  /** Bottom of the sidebar: booking page link, account. */
  sidebarFooter?: React.ReactNode
  /** Start with the sidebar collapsed to icons. */
  defaultCollapsed?: boolean
  /** Render a nav link — pass your router's link, e.g. `(item) => <Link href={item.href} />`. */
  renderLink?: (item: AppShellLinkTarget) => React.ReactElement
  /**
   * Render inside another page (docs previews): the shell fills its container instead of the
   * viewport and the content area is not a `<main>` landmark.
   */
  embedded?: boolean
  className?: string
  /** The page: PageHeader, toolbar, content. */
  children: React.ReactNode
}

const defaultLink = (item: AppShellLinkTarget) => (
  // The label and icon arrive as children through the render prop.
  // eslint-disable-next-line jsx-a11y/anchor-has-content
  <a href={item.href} />
)

const COMING_SOON_CLASS =
  "cursor-default text-sidebar-muted-foreground hover:bg-transparent hover:text-sidebar-muted-foreground active:bg-transparent active:text-sidebar-muted-foreground"

/** “Soon” badge; screen readers hear “, coming soon” after the label. */
function SoonBadge() {
  return (
    <>
      <span
        aria-hidden="true"
        className="ml-auto shrink-0 rounded-sm border border-sidebar-border px-1.5 text-[0.6875rem] leading-4 font-medium text-sidebar-muted-foreground group-data-[collapsible=icon]:hidden"
      >
        Soon
      </span>
      <span className="sr-only">, coming soon</span>
    </>
  )
}

function NavItem({
  item,
  currentHref,
  renderLink,
}: {
  item: AppShellNavItem
  currentHref: string
  renderLink: (item: AppShellLinkTarget) => React.ReactElement
}) {
  const { state, setOpen: setSidebarOpen } = useSidebar()
  const hasCurrentChild = item.children?.some((child) => child.href === currentHref) ?? false
  const [open, setOpen] = React.useState(hasCurrentChild)

  const label = (
    <>
      {item.icon}
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
    </>
  )

  if (item.children?.length) {
    return (
      <CollapsiblePrimitive.Root open={open} onOpenChange={setOpen} render={<SidebarMenuItem />}>
        <CollapsiblePrimitive.Trigger
          render={
            <SidebarMenuButton
              tooltip={item.label}
              isActive={hasCurrentChild && state === "collapsed"}
              onClick={() => {
                // Collapsed to icons: show the sidebar with this list open.
                if (state === "collapsed") {
                  setSidebarOpen(true)
                  setOpen(true)
                }
              }}
            />
          }
        >
          {label}
          <ChevronDownIcon
            aria-hidden="true"
            className="ml-auto transition-transform duration-(--eq-duration-fast) group-data-[collapsible=icon]:hidden in-data-panel-open:rotate-180"
          />
        </CollapsiblePrimitive.Trigger>
        <CollapsiblePrimitive.Panel>
          <SidebarMenuSub aria-label={item.label} className="mr-0 pr-0">
            {item.children.map((child) => (
              <SidebarMenuSubItem key={child.href}>
                {child.comingSoon ? (
                  <SidebarMenuSubButton
                    data-coming-soon=""
                    aria-disabled="true"
                    className={cn(
                      "h-8",
                      COMING_SOON_CLASS,
                      "[&>svg]:text-sidebar-muted-foreground"
                    )}
                    render={<span />}
                  >
                    {child.icon}
                    <span>{child.label}</span>
                    <SoonBadge />
                  </SidebarMenuSubButton>
                ) : (
                  <SidebarMenuSubButton
                    isActive={child.href === currentHref}
                    className="h-8 data-active:font-medium"
                    render={renderLink(child)}
                  >
                    {child.icon}
                    <span>{child.label}</span>
                  </SidebarMenuSubButton>
                )}
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsiblePrimitive.Panel>
      </CollapsiblePrimitive.Root>
    )
  }

  if (item.comingSoon) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          data-coming-soon=""
          aria-disabled="true"
          tooltip={`${item.label} — coming soon`}
          className={COMING_SOON_CLASS}
          render={<span />}
        >
          {label}
          <SoonBadge />
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={item.href === currentHref}
        tooltip={item.label}
        aria-label={item.badgeLabel && item.badge ? `${item.label}, ${item.badgeLabel}` : undefined}
        render={renderLink(item)}
      >
        {label}
        {item.badge != null && item.badge > 0 && (
          <SidebarMenuBadge aria-hidden={item.badgeLabel ? true : undefined}>
            {item.badge}
          </SidebarMenuBadge>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

/** Round collapse/expand button on the sidebar's edge (desktop). */
function SidebarEdgeToggle() {
  const { open, toggleSidebar } = useSidebar()
  const label = open ? "Collapse sidebar" : "Expand sidebar"
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            data-slot="app-shell-edge-toggle"
            variant="outline"
            size="icon-sm"
            aria-label={label}
            aria-expanded={open}
            onClick={toggleSidebar}
            className="absolute top-1/2 -right-4 z-20 hidden -translate-y-1/2 rounded-full bg-card shadow-sm md:inline-flex dark:bg-card"
          />
        }
      >
        {open ? <ChevronLeftIcon aria-hidden="true" /> : <ChevronRightIcon aria-hidden="true" />}
      </TooltipTrigger>
      <TooltipContent side="right">
        {label}
        <kbd className="ml-1 font-mono text-[0.625rem] opacity-80">⌘B</kbd>
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * Application frame: sidebar navigation (collapsible to icons, a sheet on small screens) and the
 * page in a content box. No top bar: the page starts with its PageHeader. One per app, in the
 * root layout.
 */
function AppShell({
  brand,
  navigation,
  currentHref,
  navLabel = "Main",
  sidebarFooter,
  defaultCollapsed = false,
  renderLink = defaultLink,
  embedded = false,
  className,
  children,
}: AppShellProps) {
  const id = React.useId()
  const content = (
    <>
      {/* Small screens only: the sidebar is a sheet, opened from here. */}
      <div data-slot="app-shell-mobile-bar" className="flex items-center gap-2 px-3 pt-3 md:hidden">
        <SidebarTrigger />
      </div>
      <div className="flex flex-1 flex-col p-3 md:p-4">
        <div
          data-slot="app-shell-page"
          className="flex-1 rounded-xl border border-border bg-card p-(--eq-page-padding) shadow-xs"
        >
          {children}
        </div>
      </div>
    </>
  )

  return (
    <SidebarProvider
      defaultOpen={!defaultCollapsed}
      data-slot="app-shell"
      className={cn(embedded && "min-h-0 transform-gpu overflow-hidden", className)}
    >
      <Sidebar collapsible="icon" className={cn(embedded && "h-full")}>
        <SidebarHeader className="min-h-16 justify-center">{brand}</SidebarHeader>
        <SidebarContent>
          <nav aria-label={navLabel}>
            {navigation.map((group, index) => (
              <SidebarGroup key={group.label ?? index}>
                {group.label && (
                  <SidebarGroupLabel id={`${id}-group-${index}`}>{group.label}</SidebarGroupLabel>
                )}
                <SidebarGroupContent>
                  <SidebarMenu aria-labelledby={group.label ? `${id}-group-${index}` : undefined}>
                    {group.items.map((item) => (
                      <NavItem
                        key={item.href}
                        item={item}
                        currentHref={currentHref}
                        renderLink={renderLink}
                      />
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </nav>
        </SidebarContent>
        {sidebarFooter && (
          <SidebarFooter className="border-t border-sidebar-border">{sidebarFooter}</SidebarFooter>
        )}
        <SidebarRail />
        <SidebarEdgeToggle />
      </Sidebar>
      {embedded ? (
        <div
          data-slot="sidebar-inset"
          className="relative flex w-full min-w-0 flex-1 flex-col overflow-auto bg-background"
        >
          {content}
        </div>
      ) : (
        <SidebarInset className="min-w-0">{content}</SidebarInset>
      )}
    </SidebarProvider>
  )
}

export { AppShell }
