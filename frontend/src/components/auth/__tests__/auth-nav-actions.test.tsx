import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import AuthNavActions from "../auth-nav-actions"

const { pushMock, logoutSessionMock } = vi.hoisted(() => ({
  pushMock: vi.fn<(href: string) => void>(),
  logoutSessionMock: vi.fn<() => Promise<void>>(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}))

vi.mock("../../../lib/auth/session-manager", () => ({
  logoutSession: logoutSessionMock,
}))

describe("AuthNavActions", () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it("renders Log out button when a refresh token exists", async () => {
    render(<AuthNavActions isAuthenticated />)

    expect(await screen.findByRole("button", { name: "Log out" })).toBeInTheDocument()
  })

  it("logs out and redirects to /login when Log out is clicked", async () => {
    logoutSessionMock.mockResolvedValue()

    render(<AuthNavActions isAuthenticated />)

    fireEvent.click(await screen.findByRole("button", { name: "Log out" }))

    await waitFor(() => {
      expect(logoutSessionMock).toHaveBeenCalledTimes(1)
      expect(pushMock).toHaveBeenCalledWith("/login")
    })
  })

  it("disables the button and shows Logging out... while logout is in progress", async () => {
    let resolveLogout: (() => void) | undefined
    const pendingLogout = new Promise<void>((resolve) => {
      resolveLogout = resolve
    })
    logoutSessionMock.mockReturnValue(pendingLogout)

    render(<AuthNavActions isAuthenticated />)

    fireEvent.click(await screen.findByRole("button", { name: "Log out" }))

    expect(await screen.findByRole("button", { name: "Logging out..." })).toBeDisabled()

    resolveLogout?.()
  })

  it("renders Login link when no refresh token exists", () => {
    render(<AuthNavActions isAuthenticated={false} />)

    expect(screen.getByRole("link", { name: "Login" })).toHaveAttribute("href", "/login")
  })
})
