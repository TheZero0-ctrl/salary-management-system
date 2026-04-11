import { beforeEach, describe, expect, it, vi } from "vitest"

const tokenStoreMocks = vi.hoisted(() => ({
  getAccessToken: vi.fn<() => string | null>(),
  getRefreshToken: vi.fn<() => string | null>(),
  setAccessToken: vi.fn<(token: string) => void>(),
  clearSessionTokens: vi.fn<() => void>(),
}))

const baseUrlMocks = vi.hoisted(() => ({
  getBackendApiBaseUrl: vi.fn<() => string>(),
}))

vi.mock("../../auth/token-store", () => tokenStoreMocks)
vi.mock("../base-url", () => baseUrlMocks)

const loadAuthClient = () => import("../auth-client")

const createDeferred = <T>() => {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void

  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })

  return { promise, resolve, reject }
}

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

describe("authorizedFetch", () => {
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

  it("adds Authorization Bearer header from token store", async () => {
    tokenStoreMocks.getAccessToken.mockReturnValue("access-token-1")
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 200 }))
    const { authorizedFetch } = await loadAuthClient()

    await authorizedFetch("http://example.test/protected")

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      "http://example.test/protected",
      expect.objectContaining({
        headers: expect.anything(),
      }),
    )

    const requestInit = fetchMock.mock.calls[0]?.[1]
    expect(getHeader(requestInit?.headers, "Authorization")).toBe("Bearer access-token-1")
  })

  it("refreshes once on first 401 and retries original request with new token", async () => {
    tokenStoreMocks.getAccessToken.mockReturnValueOnce("access-token-old").mockReturnValueOnce("access-token-new")
    tokenStoreMocks.getRefreshToken.mockReturnValue("refresh-token-1")

    const firstUnauthorizedResponse = new Response(null, { status: 401 })
    const refreshSuccessResponse = new Response(JSON.stringify({ access_token: "access-token-new" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
    const retriedOkResponse = new Response(null, { status: 200 })

    fetchMock
      .mockResolvedValueOnce(firstUnauthorizedResponse)
      .mockResolvedValueOnce(refreshSuccessResponse)
      .mockResolvedValueOnce(retriedOkResponse)

    const { authorizedFetch } = await loadAuthClient()

    const response = await authorizedFetch("http://example.test/protected", { method: "GET" })

    expect(response).toBe(retriedOkResponse)
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[1]?.[0]).toBe(`${backendBaseUrl}/api/v1/session/refresh`)
    expect(fetchMock.mock.calls[1]?.[1]).toEqual(
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ refresh_token: "refresh-token-1" }),
      }),
    )
    expect(fetchMock.mock.calls[2]?.[0]).toBe("http://example.test/protected")
    expect(getHeader(fetchMock.mock.calls[2]?.[1]?.headers, "Authorization")).toBe("Bearer access-token-new")
  })

  it("clears session and returns original 401 when refresh fails", async () => {
    tokenStoreMocks.getAccessToken.mockReturnValue("access-token-old")
    tokenStoreMocks.getRefreshToken.mockReturnValue("refresh-token-1")

    const originalUnauthorizedResponse = new Response(null, { status: 401 })
    const refreshFailureResponse = new Response(null, { status: 401 })

    fetchMock.mockResolvedValueOnce(originalUnauthorizedResponse).mockResolvedValueOnce(refreshFailureResponse)

    const { authorizedFetch } = await loadAuthClient()

    const response = await authorizedFetch("http://example.test/protected")

    expect(response).toBe(originalUnauthorizedResponse)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[1]?.[0]).toBe(`${backendBaseUrl}/api/v1/session/refresh`)
    expect(tokenStoreMocks.clearSessionTokens).toHaveBeenCalledTimes(1)
  })

  it("shares one refresh request across concurrent 401 responses", async () => {
    tokenStoreMocks.getAccessToken.mockReturnValueOnce("access-token-old").mockReturnValueOnce("access-token-old").mockReturnValue("access-token-new")
    tokenStoreMocks.getRefreshToken.mockReturnValue("refresh-token-1")

    const refreshDeferred = createDeferred<Response>()

    fetchMock.mockImplementation((input) => {
      const url = typeof input === "string" ? input : input.url

      if (url === `${backendBaseUrl}/api/v1/session/refresh`) {
        return refreshDeferred.promise
      }

      if (url === "http://example.test/a" || url === "http://example.test/b") {
        const callCountForUrl = fetchMock.mock.calls.filter(([callInput]) => {
          const calledUrl = typeof callInput === "string" ? callInput : callInput.url
          return calledUrl === url
        }).length

        if (callCountForUrl === 1) {
          return Promise.resolve(new Response(null, { status: 401 }))
        }

        return Promise.resolve(new Response(null, { status: 200 }))
      }

      return Promise.reject(new Error(`Unexpected URL: ${url}`))
    })

    const { authorizedFetch } = await loadAuthClient()

    const firstRequest = authorizedFetch("http://example.test/a")
    const secondRequest = authorizedFetch("http://example.test/b")

    await Promise.resolve()

    refreshDeferred.resolve(
      new Response(JSON.stringify({ access_token: "access-token-new" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )

    const [firstResponse, secondResponse] = await Promise.all([firstRequest, secondRequest])

    expect(firstResponse.status).toBe(200)
    expect(secondResponse.status).toBe(200)

    const refreshCalls = fetchMock.mock.calls.filter(([callInput]) => {
      const calledUrl = typeof callInput === "string" ? callInput : callInput.url
      return calledUrl === `${backendBaseUrl}/api/v1/session/refresh`
    })

    expect(refreshCalls).toHaveLength(1)

    const retryCallForA = fetchMock.mock.calls.filter(([callInput]) => {
      const calledUrl = typeof callInput === "string" ? callInput : callInput.url
      return calledUrl === "http://example.test/a"
    })[1]
    const retryCallForB = fetchMock.mock.calls.filter(([callInput]) => {
      const calledUrl = typeof callInput === "string" ? callInput : callInput.url
      return calledUrl === "http://example.test/b"
    })[1]

    expect(getHeader(retryCallForA?.[1]?.headers, "Authorization")).toBe("Bearer access-token-new")
    expect(getHeader(retryCallForB?.[1]?.headers, "Authorization")).toBe("Bearer access-token-new")
  })
})
