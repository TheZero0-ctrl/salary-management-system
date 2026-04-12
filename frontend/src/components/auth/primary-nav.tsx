"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import AuthNavActions from "./auth-nav-actions"
import { getRefreshToken, subscribeToAuthStateChange } from "../../lib/auth/token-store"

const navLinkBaseClassName = "rounded-lg px-3 py-2 text-sm"
const navLinkInactiveClassName = "text-black/70 hover:bg-black/5"
const navLinkActiveClassName = "bg-black/10 text-black"
const getAuthSnapshot = () => (typeof window !== "undefined" ? Boolean(getRefreshToken()) : false)
const getServerAuthSnapshot = () => false
const mobileQuery = "(max-width: 767px)"

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
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") {
      return false
    }

    return window.matchMedia(mobileQuery).matches
  })
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const mediaQuery = window.matchMedia(mobileQuery)
    const updateIsMobile = () => {
      setIsMobile(mediaQuery.matches)
    }

    mediaQuery.addEventListener("change", updateIsMobile)

    return () => {
      mediaQuery.removeEventListener("change", updateIsMobile)
    }
  }, [])

  const showWorkspaceNavLinks = shouldShowWorkspaceLinks && (!isMobile || isMenuOpen)
  const menuExpanded = isMobile && isMenuOpen
  const handleMenuKeyboardToggle = (event: {
    key: string
    code?: string
    keyCode?: number
    which?: number
  }) => {
    const isEnterKey = event.key === "Enter" || event.code === "Enter" || event.keyCode === 13 || event.which === 13
    const isSpaceKey =
      event.key === " " || event.key === "Spacebar" || event.code === "Space" || event.keyCode === 32 || event.which === 32

    if (!isEnterKey && !isSpaceKey) {
      return false
    }

    setIsMenuOpen((currentValue) => !currentValue)
    return true
  }

  const navLinkClassName = (isActive: boolean) =>
    [navLinkBaseClassName, isActive ? navLinkActiveClassName : navLinkInactiveClassName].join(" ")

  return (
    <nav aria-label="Primary" className="flex items-center gap-1">
      {shouldShowWorkspaceLinks && isMobile ? (
        <button
          type="button"
          aria-expanded={menuExpanded}
          aria-label="Menu"
          className={navLinkClassName(false)}
          onClick={(event) => {
            if (event.detail === 0) {
              return
            }

            setIsMenuOpen((currentValue) => !currentValue)
          }}
          onKeyDown={(event) => {
            if (!handleMenuKeyboardToggle(event)) {
              return
            }

            event.preventDefault()
          }}
        >
          Menu
        </button>
      ) : null}

      {showWorkspaceNavLinks ? (
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
