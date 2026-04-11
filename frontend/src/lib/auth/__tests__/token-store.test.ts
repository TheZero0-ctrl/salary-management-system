import { beforeEach, describe, expect, it, vi } from "vitest"

const loadTokenStore = () => import("../token-store")

describe("token-store", () => {
  beforeEach(() => {
    vi.resetModules()
    localStorage.clear()
  })

  it("keeps the access token in memory for the current session", async () => {
    const tokenStore = await loadTokenStore()

    tokenStore.setAccessToken("access-token")

    expect(tokenStore.getAccessToken()).toBe("access-token")
    expect(localStorage.length).toBe(0)
  })

  it("removes the in-memory access token when cleared", async () => {
    const tokenStore = await loadTokenStore()

    tokenStore.setAccessToken("access-token")
    tokenStore.clearAccessToken()

    expect(tokenStore.getAccessToken()).toBeNull()
    expect(localStorage.length).toBe(0)
  })

  it("persists the refresh token in localStorage", async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem")
    const tokenStore = await loadTokenStore()

    tokenStore.setRefreshToken("refresh-token")

    expect(setItemSpy).toHaveBeenCalledWith(expect.any(String), "refresh-token")
    expect(tokenStore.getRefreshToken()).toBe("refresh-token")
    expect(localStorage.length).toBe(1)
  })

  it("clearSessionTokens clears in-memory access and persisted refresh tokens", async () => {
    const tokenStore = await loadTokenStore()

    tokenStore.setAccessToken("access-token")
    tokenStore.setRefreshToken("refresh-token")
    tokenStore.clearSessionTokens()

    expect(tokenStore.getAccessToken()).toBeNull()
    expect(tokenStore.getRefreshToken()).toBeNull()
    expect(localStorage.length).toBe(0)
  })
})
