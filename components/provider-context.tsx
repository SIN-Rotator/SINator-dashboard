"use client"

import * as React from "react"
import { DEFAULT_PROVIDER, getProvider, type ProviderConfig, type ProviderId } from "@/lib/providers"

const STORAGE_KEY = "sinator.active_provider"

interface Ctx {
  provider: ProviderConfig
  providerId: ProviderId
  setProviderId: (id: ProviderId) => void
}

const ProviderCtx = React.createContext<Ctx | null>(null)

export function ProviderContextProvider({ children }: { children: React.ReactNode }) {
  const [providerId, setProviderIdState] = React.useState<ProviderId>(DEFAULT_PROVIDER)

  // Hydrate from localStorage on mount
  React.useEffect(() => {
    if (typeof window === "undefined") return
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const p = getProvider(stored)
      setProviderIdState(p.id)
    }
  }, [])

  const setProviderId = React.useCallback((id: ProviderId) => {
    setProviderIdState(id)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, id)
    }
  }, [])

  const provider = getProvider(providerId)

  return (
    <ProviderCtx.Provider value={{ provider, providerId, setProviderId }}>
      {children}
    </ProviderCtx.Provider>
  )
}

export function useProvider(): Ctx {
  const ctx = React.useContext(ProviderCtx)
  if (!ctx) throw new Error("useProvider must be used within ProviderContextProvider")
  return ctx
}
