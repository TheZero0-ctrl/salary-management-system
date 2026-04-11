const REFRESH_TOKEN_STORAGE_KEY = "auth.refreshToken"
const AUTH_STATE_EVENT = "auth-state-change"

let accessToken: string | null = null

const notifyAuthStateChange = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_STATE_EVENT))
  }
}

export const setAccessToken = (token: string) => {
  accessToken = token
  notifyAuthStateChange()
}

export const getAccessToken = (): string | null => accessToken

export const clearAccessToken = () => {
  accessToken = null
  notifyAuthStateChange()
}

export const setRefreshToken = (token: string) => {
  localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token)
  notifyAuthStateChange()
}

export const getRefreshToken = (): string | null =>
  localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)

const clearRefreshToken = () => {
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY)
}

export const clearSessionTokens = () => {
  clearAccessToken()
  clearRefreshToken()
  notifyAuthStateChange()
}

export const subscribeToAuthStateChange = (listener: () => void) => {
  if (typeof window === "undefined") {
    return () => {}
  }

  const wrappedListener = () => listener()

  window.addEventListener(AUTH_STATE_EVENT, wrappedListener)
  window.addEventListener("storage", wrappedListener)

  return () => {
    window.removeEventListener(AUTH_STATE_EVENT, wrappedListener)
    window.removeEventListener("storage", wrappedListener)
  }
}
