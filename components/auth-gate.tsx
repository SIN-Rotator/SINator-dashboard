"use client"

import * as React from "react"
import { LoginDialog } from "@/components/login-dialog"

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = React.useState(false)
  const [showLogin, setShowLogin] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    const token = window.localStorage.getItem("sinator.auth_token")
    if (token) {
      setAuthed(true)
    } else {
      setShowLogin(true)
    }
  }, [])

  function handleLogin(token: string) {
    window.localStorage.setItem("sinator.auth_token", token)
    setAuthed(true)
    setShowLogin(false)
  }

  // Don't show login during SSR
  if (!mounted) return null

  return (
    <>
      <LoginDialog open={showLogin} onLogin={handleLogin} />
      {authed && children}
    </>
  )
}
