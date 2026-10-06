import type { Metadata } from "next"

import { Providers } from "@/components/app/providers"

import "./globals.css"

export const metadata: Metadata = {
  title: { default: "Rentino", template: "%s · Rentino" },
  description: "Rentino admin panel",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // next-themes sets the theme class on <html> before hydration.
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
