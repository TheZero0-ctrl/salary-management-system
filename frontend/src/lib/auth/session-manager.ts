import { getBackendApiBaseUrl } from "../api/base-url"
import { clearSessionTokens, getAccessToken, getRefreshToken } from "./token-store"

export const logoutSession = async (): Promise<void> => {
  const accessToken = getAccessToken()
  const refreshToken = getRefreshToken()
  const hasSessionTokens = Boolean(accessToken && refreshToken)

  try {
    if (hasSessionTokens) {
      await fetch(`${getBackendApiBaseUrl()}/api/v1/session`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
    }
  } finally {
    clearSessionTokens()
  }
}
