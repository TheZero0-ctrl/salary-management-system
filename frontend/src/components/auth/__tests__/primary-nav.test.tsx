import { cleanup, fireEvent, render, screen, within } from "@testing-library/react"
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
  const originalMatchMedia = window.matchMedia

  const mockMatchMedia = (isMobile: boolean) => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === "(max-width: 767px)" ? isMobile : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  }

  beforeEach(() => {
    pathnameMock.mockReturnValue("/")
    mockMatchMedia(false)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: originalMatchMedia,
    })
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

  it("keeps Employees inactive for nested employee routes", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    pathnameMock.mockReturnValue("/employees/EMP-0001")

    render(<PrimaryNav />)

    const employeesLink = await screen.findByRole("link", { name: "Employees" })
    const insightsLink = screen.getByRole("link", { name: "Insights" })

    expect(employeesLink).not.toHaveAttribute("aria-current")
    expect(employeesLink).not.toHaveClass("bg-black/10")
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

  it("hides workspace links on mobile for authenticated users until menu is toggled", () => {
    mockMatchMedia(true)
    getRefreshTokenMock.mockReturnValue("refresh-token")

    render(<PrimaryNav />)

    expect(screen.queryByRole("link", { name: "Employees" })).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Insights" })).not.toBeInTheDocument()
  })

  it("toggles mobile menu with keyboard Enter/Space and then shows workspace links", () => {
    mockMatchMedia(true)
    getRefreshTokenMock.mockReturnValue("refresh-token")

    render(<PrimaryNav />)

    const menuButton = screen.getByRole("button", { name: /menu/i })

    menuButton.focus()
    expect(menuButton).toHaveFocus()

    fireEvent.keyDown(menuButton, { key: "Enter" })
    expect(screen.getByRole("link", { name: "Employees" })).toBeInTheDocument()

    fireEvent.keyDown(menuButton, { key: " " })
    expect(screen.queryByRole("link", { name: "Employees" })).not.toBeInTheDocument()

    fireEvent.keyDown(menuButton, { key: " " })
    expect(screen.getByRole("link", { name: "Insights" })).toBeInTheDocument()
  })

  it("keeps workspace links visible on desktop without toggling", () => {
    mockMatchMedia(false)
    getRefreshTokenMock.mockReturnValue("refresh-token")

    render(<PrimaryNav />)

    expect(screen.getByRole("link", { name: "Employees" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Insights" })).toBeInTheDocument()
  })
})
