"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { logoutSession } from "../../lib/auth/session-manager"

const loginActionClassName = "rounded-lg px-3 py-2 text-sm text-black/70 hover:bg-black/5"
const logoutActionClassName =
  "rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100 disabled:opacity-70"

type AuthNavActionsProps = {
  isAuthenticated: boolean
  onLoggedOut?: () => void
}

const AuthNavActions = ({ isAuthenticated, onLoggedOut }: AuthNavActionsProps) => {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)

    try {
      await logoutSession()
    } finally {
      setIsLoggingOut(false)
      onLoggedOut?.()
      router.push("/login")
    }
  }

  if (!isAuthenticated) {
    return (
      <Link className={loginActionClassName} href="/login">
        Login
      </Link>
    )
  }

  return (
    <button className={logoutActionClassName} disabled={isLoggingOut} onClick={handleLogout} type="button">
      {isLoggingOut ? "Logging out..." : "Log out"}
    </button>
  )
}

export default AuthNavActions
