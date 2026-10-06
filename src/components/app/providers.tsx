"use client"

import { ThemeProvider, useTheme } from "next-themes"
import type * as React from "react"

import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

function ThemedToaster() {
  const { resolvedTheme } = useTheme()
  return (
    <Toaster
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      // Top-center: the default (bottom-right) covers the EditPanel footer (Save and stay / Save),
      // and bottom-left crowds the sidebar footer (its 20px close button then fails 2.5.8).
      // Reported to EQ-librium.
      position="top-center"
    />
  )
}

/** App-wide providers, mounted once in the root layout. */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        {children}
        <ThemedToaster />
      </TooltipProvider>
    </ThemeProvider>
  )
}
