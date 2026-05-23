"use client"

import * as React from "react"

const TOKEN_KEY = "sinator.auth_token"

function getToken(): string | null {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(TOKEN_KEY)
}

function setToken(token: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(TOKEN_KEY, token)
  }
}

export function getAuthHeader(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function useAuth() {
  const [token, setTokenState] = React.useState<string | null>(null)
  const [showLogin, setShowLogin] = React.useState(false)

  React.useEffect(() => {
    const t = getToken()
    if (t) {
      setTokenState(t)
    } else {
      setShowLogin(true)
    }
  }, [])

  function login(t: string) {
    setToken(t)
    setTokenState(t)
    setShowLogin(false)
  }

  function logout() {
    window.localStorage.removeItem(TOKEN_KEY)
    setTokenState(null)
    setShowLogin(true)
  }

  return { token, showLogin, login, logout, isAuthed: !!token }
}

export { getToken, setToken }
