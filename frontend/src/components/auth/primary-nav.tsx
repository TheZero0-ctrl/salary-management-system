"use client"

import { useSyncExternalStore } from "react"
import Link from "next/link"

import AuthNavActions from "./auth-nav-actions"
import { getRefreshToken, subscribeToAuthStateChange } from "../../lib/auth/token-store"

const navLinkClassName = "rounded-lg px-3 py-2 text-sm text-black/70 hover:bg-black/5"
const getAuthSnapshot = () => (typeof window !== "undefined" ? Boolean(getRefreshToken()) : false)
const getServerAuthSnapshot = () => false

type PrimaryNavProps = {
  showWorkspaceLinks?: boolean
}

const PrimaryNav = ({ showWorkspaceLinks = false }: PrimaryNavProps) => {
  const isAuthenticated = useSyncExternalStore(
    subscribeToAuthStateChange,
    getAuthSnapshot,
    getServerAuthSnapshot,
  )

  const shouldShowWorkspaceLinks = showWorkspaceLinks || isAuthenticated

  return (
    <nav aria-label="Primary" className="flex items-center gap-1">
      {shouldShowWorkspaceLinks ? (
        <>
          <Link className={navLinkClassName} href="/employees">
            Employees
          </Link>
          <Link className={navLinkClassName} href="/insights">
            Insights
          </Link>
        </>
      ) : null}

      <AuthNavActions isAuthenticated={isAuthenticated} />
    </nav>
  )
}

export default PrimaryNav
