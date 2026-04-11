import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { getRefreshToken } from "./token-store"

const LOGIN_PATH = "/login"

export const useProtectedRoute = () => {
  const router = useRouter()

  useEffect(() => {
    const hasRefreshToken = Boolean(getRefreshToken())

    if (hasRefreshToken) return

    router.push(LOGIN_PATH)
  }, [router])
}
