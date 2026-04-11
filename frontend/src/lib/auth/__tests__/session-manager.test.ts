import { beforeEach, describe, expect, it, vi } from "vitest"

const tokenStoreMocks = vi.hoisted(() => ({
  getAccessToken: vi.fn<() => string | null>(),
  getRefreshToken: vi.fn<() => string | null>(),
  clearSessionTokens: vi.fn<() => void>(),
}))

const baseUrlMocks = vi.hoisted(() => ({
  getBackendApiBaseUrl: vi.fn<() => string>(),
}))

vi.mock("../token-store", () => tokenStoreMocks)
vi.mock("../../api/base-url", () => baseUrlMocks)

const loadSessionManager = () => import("../session-manager")

const getHeader = (headers: HeadersInit | undefined, name: string) => {
  if (!headers) {
    return null
  }

  if (headers instanceof Headers) {
    return headers.get(name)
  }

  if (Array.isArray(headers)) {
    const foundHeader = headers.find(([headerName]) => headerName.toLowerCase() === name.toLowerCase())
    return foundHeader?.[1] ?? null
  }

  return headers[name as keyof typeof headers] ?? headers[name.toLowerCase() as keyof typeof headers] ?? null
}

describe("logoutSession", () => {
  const backendBaseUrl = "http://backend.test"
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    fetchMock.mockReset()
    vi.stubGlobal("fetch", fetchMock)

    baseUrlMocks.getBackendApiBaseUrl.mockReturnValue(backendBaseUrl)
    tokenStoreMocks.getAccessToken.mockReturnValue(null)
    tokenStoreMocks.getRefreshToken.mockReturnValue(null)
  })

  it("calls backend session delete with access token and refresh token body", async () => {
    tokenStoreMocks.getAccessToken.mockReturnValue("access-token-1")
    tokenStoreMocks.getRefreshToken.mockReturnValue("refresh-token-1")
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))

    const { logoutSession } = await loadSessionManager()

    await logoutSession()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      `${backendBaseUrl}/api/v1/session`,
      expect.objectContaining({
        method: "DELETE",
        body: JSON.stringify({ refresh_token: "refresh-token-1" }),
        headers: expect.anything(),
      }),
    )

    const requestInit = fetchMock.mock.calls[0]?.[1]
    expect(getHeader(requestInit?.headers, "Authorization")).toBe("Bearer access-token-1")
  })

  it("clears session tokens after successful logout attempt", async () => {
    tokenStoreMocks.getAccessToken.mockReturnValue("access-token-1")
    tokenStoreMocks.getRefreshToken.mockReturnValue("refresh-token-1")
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))

    const { logoutSession } = await loadSessionManager()

    await logoutSession()

    expect(tokenStoreMocks.clearSessionTokens).toHaveBeenCalledTimes(1)
  })

  it("clears session tokens when backend logout request fails", async () => {
    tokenStoreMocks.getAccessToken.mockReturnValue("access-token-1")
    tokenStoreMocks.getRefreshToken.mockReturnValue("refresh-token-1")
    fetchMock.mockRejectedValueOnce(new Error("network error"))

    const { logoutSession } = await loadSessionManager()

    await logoutSession().catch(() => undefined)

    expect(tokenStoreMocks.clearSessionTokens).toHaveBeenCalledTimes(1)
  })

  it("does not call fetch when tokens are missing and still clears session tokens", async () => {
    const { logoutSession } = await loadSessionManager()

    await logoutSession()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(tokenStoreMocks.clearSessionTokens).toHaveBeenCalledTimes(1)
  })
})
