"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { logoutSession } from "../../lib/auth/session-manager"

const navActionClassName = "rounded-lg px-3 py-2 text-sm text-black/70 hover:bg-black/5"

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
      <Link className={navActionClassName} href="/login">
        Login
      </Link>
    )
  }

  return (
    <button className={navActionClassName} disabled={isLoggingOut} onClick={handleLogout} type="button">
      {isLoggingOut ? "Logging out..." : "Log out"}
    </button>
  )
}

export default AuthNavActions
