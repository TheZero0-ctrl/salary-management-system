import { cleanup, render, screen, within } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import PrimaryNav from "../primary-nav"

const { getRefreshTokenMock, pathnameMock } = vi.hoisted(() => ({
  getRefreshTokenMock: vi.fn<() => string | null>(),
  pathnameMock: vi.fn<() => string>(),
}))

vi.mock("next/navigation", () => ({
  usePathname: pathnameMock,
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock("../../../lib/auth/token-store", () => ({
  getRefreshToken: getRefreshTokenMock,
  subscribeToAuthStateChange: () => () => {},
}))

describe("PrimaryNav", () => {
  beforeEach(() => {
    pathnameMock.mockReturnValue("/")
  })

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

  it("marks Employees as active for /employees and keeps Insights inactive", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    pathnameMock.mockReturnValue("/employees")

    render(<PrimaryNav />)

    const employeesLink = await screen.findByRole("link", { name: "Employees" })
    const insightsLink = screen.getByRole("link", { name: "Insights" })

    expect(employeesLink).toHaveAttribute("aria-current", "page")
    expect(employeesLink).toHaveClass("bg-black/10")
    expect(insightsLink).not.toHaveAttribute("aria-current")
    expect(insightsLink).not.toHaveClass("bg-black/10")
  })

  it("marks Employees as active for nested employee routes", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    pathnameMock.mockReturnValue("/employees/EMP-0001")

    render(<PrimaryNav />)

    const employeesLink = await screen.findByRole("link", { name: "Employees" })
    const insightsLink = screen.getByRole("link", { name: "Insights" })

    expect(employeesLink).toHaveAttribute("aria-current", "page")
    expect(employeesLink).toHaveClass("bg-black/10")
    expect(insightsLink).not.toHaveAttribute("aria-current")
  })

  it("marks Insights as active for /insights and keeps Employees inactive", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    pathnameMock.mockReturnValue("/insights")

    render(<PrimaryNav />)

    const insightsLink = await screen.findByRole("link", { name: "Insights" })
    const employeesLink = screen.getByRole("link", { name: "Employees" })

    expect(insightsLink).toHaveAttribute("aria-current", "page")
    expect(insightsLink).toHaveClass("bg-black/10")
    expect(employeesLink).not.toHaveAttribute("aria-current")
    expect(employeesLink).not.toHaveClass("bg-black/10")
  })
})
