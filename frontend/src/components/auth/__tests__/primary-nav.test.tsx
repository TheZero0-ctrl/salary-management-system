import { cleanup, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import PrimaryNav from "../primary-nav"

const { getRefreshTokenMock } = vi.hoisted(() => ({
  getRefreshTokenMock: vi.fn<() => string | null>(),
}))

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock("../../../lib/auth/token-store", () => ({
  getRefreshToken: getRefreshTokenMock,
  subscribeToAuthStateChange: () => () => {},
}))

describe("PrimaryNav", () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it("shows only Login when user is not authenticated", async () => {
    getRefreshTokenMock.mockReturnValue(null)

    render(<PrimaryNav />)

    expect(await screen.findByRole("link", { name: "Login" })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Employees" })).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Insights" })).not.toBeInTheDocument()
  })

  it("shows Employees and Insights links with Log out at the end when authenticated", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")

    render(<PrimaryNav />)

    const nav = screen.getByRole("navigation", { name: "Primary" })
    const labels = [
      ...within(nav).getAllByRole("link").map((element) => element.textContent),
      ...within(nav).getAllByRole("button").map((element) => element.textContent),
    ]

    expect(labels).toEqual(["Employees", "Insights", "Log out"])
  })
})
