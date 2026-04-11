import { cleanup, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import EmployeesPage from "../employees/page"

const { pushMock, getRefreshTokenMock } = vi.hoisted(() => ({
  pushMock: vi.fn<(href: string) => void>(),
  getRefreshTokenMock: vi.fn<() => string | null>(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}))

vi.mock("../../lib/auth/token-store", () => ({
  getRefreshToken: getRefreshTokenMock,
}))

describe("Employees page", () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it("redirects to /login when refresh token is missing", async () => {
    getRefreshTokenMock.mockReturnValue(null)

    render(<EmployeesPage />)

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/login")
    })
  })

  it("does not redirect and renders Employee Directory when refresh token exists", () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")

    render(<EmployeesPage />)

    expect(pushMock).not.toHaveBeenCalled()
    expect(screen.getByRole("heading", { name: "Employee Directory" })).toBeInTheDocument()
  })
})
