import {
  BikeIcon,
  BuildingIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  LayoutDashboardIcon,
  ReceiptIcon,
  ReceiptTextIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  TicketPercentIcon,
  TruckIcon,
  UserCogIcon,
  UsersIcon,
  WrenchIcon,
} from "lucide-react"

import type { AppShellNavGroup } from "@/components/eq/app-shell"
import { can, type SessionUser } from "@/lib/session/types"

export const DISCOUNT_CODES_HREF = "/settings/discount-codes"

/**
 * Rentino admin navigation (EQ `RENTINO_PILOT_NAV`). The panel ships section by section:
 * Discount codes is live, everything else is `comingSoon` — remove the flag when a section ships.
 */
export const NAVIGATION: AppShellNavGroup[] = [
  {
    items: [
      { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboardIcon />, comingSoon: true },
      { label: "Calendar", href: "/calendar", icon: <CalendarDaysIcon />, comingSoon: true },
      { label: "Orders", href: "/orders", icon: <ReceiptTextIcon />, comingSoon: true },
      { label: "Customers", href: "/customers", icon: <UsersIcon />, comingSoon: true },
      { label: "Equipment", href: "/equipment", icon: <BikeIcon />, comingSoon: true },
      { label: "Transport", href: "/transport", icon: <TruckIcon />, comingSoon: true },
      { label: "Service", href: "/service", icon: <WrenchIcon />, comingSoon: true },
      {
        label: "Settings",
        href: "/settings",
        icon: <SlidersHorizontalIcon />,
        children: [
          {
            label: "General settings",
            href: "/settings/general",
            icon: <SettingsIcon />,
            comingSoon: true,
          },
          { label: "Users", href: "/settings/users", icon: <UserCogIcon />, comingSoon: true },
          { label: "Roles", href: "/settings/roles", icon: <ShieldCheckIcon />, comingSoon: true },
          {
            label: "Branches",
            href: "/settings/branches",
            icon: <BuildingIcon />,
            comingSoon: true,
          },
          { label: "Discount codes", href: DISCOUNT_CODES_HREF, icon: <TicketPercentIcon /> },
          {
            label: "Payments",
            href: "/settings/payments",
            icon: <CreditCardIcon />,
            comingSoon: true,
          },
          { label: "Tax", href: "/settings/tax", icon: <ReceiptIcon />, comingSoon: true },
        ],
      },
    ],
  },
]

/** Navigation as `user` sees it: Discount codes needs "Manage discount codes" (WHLZ-566 §5). */
export function navigationFor(user: Pick<SessionUser, "permissions">): AppShellNavGroup[] {
  if (can(user, "discount_codes.manage")) return NAVIGATION
  return NAVIGATION.map((group) => ({
    ...group,
    items: group.items.map((item) =>
      item.children
        ? { ...item, children: item.children.filter((c) => c.href !== DISCOUNT_CODES_HREF) }
        : item
    ),
  }))
}
