"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { ProviderSwitcher } from "@/components/provider-switcher"
import { useProvider } from "@/components/provider-context"

const nav = [
  { href: "/", label: "Dashboard" },
  { href: "/rotation", label: "Rotation" },
  { href: "/hilfe", label: "Hilfe" },
]

export function Header() {
  const path = usePathname()
  const { provider } = useProvider()
  const Icon = provider.icon
  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-4 sm:gap-6 min-w-0">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="size-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Icon className={cn("size-4", provider.accent)} />
            </div>
            <span className="font-semibold tracking-tight hidden sm:inline">SINator</span>
          </Link>
          <nav className="flex items-center gap-1 overflow-x-auto">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "px-2.5 sm:px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap",
                  path === n.href
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ProviderSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
