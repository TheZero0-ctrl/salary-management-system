"use client"

import { useSyncExternalStore } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import AuthNavActions from "./auth-nav-actions"
import { getRefreshToken, subscribeToAuthStateChange } from "../../lib/auth/token-store"

const navLinkBaseClassName = "rounded-lg px-3 py-2 text-sm"
const navLinkInactiveClassName = "text-black/70 hover:bg-black/5"
const navLinkActiveClassName = "bg-black/10 text-black"
const getAuthSnapshot = () => (typeof window !== "undefined" ? Boolean(getRefreshToken()) : false)
const getServerAuthSnapshot = () => false

type PrimaryNavProps = {
  showWorkspaceLinks?: boolean
}

const PrimaryNav = ({ showWorkspaceLinks = false }: PrimaryNavProps) => {
  const pathname = usePathname()
  const isAuthenticated = useSyncExternalStore(
    subscribeToAuthStateChange,
    getAuthSnapshot,
    getServerAuthSnapshot,
  )

  const shouldShowWorkspaceLinks = showWorkspaceLinks || isAuthenticated
  const isEmployeesActive = pathname === "/employees"
  const isInsightsActive = Boolean(pathname?.startsWith("/insights"))

  const navLinkClassName = (isActive: boolean) =>
    [navLinkBaseClassName, isActive ? navLinkActiveClassName : navLinkInactiveClassName].join(" ")

  return (
    <nav aria-label="Primary" className="flex items-center gap-1">
      {shouldShowWorkspaceLinks ? (
        <>
          <Link
            aria-current={isEmployeesActive ? "page" : undefined}
            className={navLinkClassName(isEmployeesActive)}
            href="/employees"
          >
            Employees
          </Link>
          <Link
            aria-current={isInsightsActive ? "page" : undefined}
            className={navLinkClassName(isInsightsActive)}
            href="/insights"
          >
            Insights
          </Link>
        </>
      ) : null}

      <AuthNavActions isAuthenticated={isAuthenticated} />
    </nav>
  )
}

export default PrimaryNav
