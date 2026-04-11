import { cleanup, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import AuthLayout from "../(auth)/layout"
import WorkspaceLayout from "../(workspace)/layout"

const { pushMock } = vi.hoisted(() => ({
  pushMock: vi.fn<(href: string) => void>(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}))

describe("App route shells", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders protected content inside the workspace shell with primary navigation", () => {
    render(
      <WorkspaceLayout>
        <h1>Employee Directory</h1>
      </WorkspaceLayout>,
    )

    expect(screen.getByRole("heading", { name: "Employee Directory" })).toBeInTheDocument()

    const primaryNav = screen.getByRole("navigation", { name: "Primary" })
    expect(within(primaryNav).getByRole("link", { name: "Employees" })).toBeInTheDocument()
    expect(within(primaryNav).getByRole("link", { name: "Insights" })).toBeInTheDocument()
  })

  it("renders login content in an auth-only shell without workspace header or primary navigation", () => {
    render(
      <AuthLayout>
        <h1>Sign in</h1>
      </AuthLayout>,
    )

    expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument()
    expect(screen.queryByRole("navigation", { name: "Primary" })).not.toBeInTheDocument()
    expect(screen.queryByText("HR Workspace")).not.toBeInTheDocument()
  })
})
