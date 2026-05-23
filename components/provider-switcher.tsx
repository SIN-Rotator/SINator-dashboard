"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronsUpDown, Check } from "lucide-react"
import { useProvider } from "@/components/provider-context"
import { PROVIDER_LIST } from "@/lib/providers"
import { cn } from "@/lib/utils"

export function ProviderSwitcher() {
  const { provider, providerId, setProviderId } = useProvider()
  const Icon = provider.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 h-9 px-2.5 sm:px-3 max-w-[200px]"
          aria-label="Rotator wechseln"
        >
          <Icon className={cn("size-4 shrink-0", provider.accent)} />
          <span className="truncate font-medium">{provider.shortLabel}</span>
          <ChevronsUpDown className="size-3.5 opacity-50 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Rotator wählen</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {PROVIDER_LIST.map((p) => {
          const ItemIcon = p.icon
          const active = p.id === providerId
          return (
            <DropdownMenuItem
              key={p.id}
              onClick={() => setProviderId(p.id)}
              className="flex items-start gap-2.5 py-2 cursor-pointer"
            >
              <ItemIcon className={cn("size-4 mt-0.5 shrink-0", p.accent)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{p.label}</span>
                  {active && <Check className="size-3.5 text-primary" />}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">{p.description}</p>
              </div>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
