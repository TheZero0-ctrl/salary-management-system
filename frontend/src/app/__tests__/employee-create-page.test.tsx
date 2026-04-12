import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import EmployeeCreatePage from "../(workspace)/employees/new/page"

type CreateEmployeeResult =
  | { kind: "created"; employeeCode: string }
  | { kind: "validation-error"; fieldErrors: Record<string, string> }
  | { kind: "duplicate-employee-code"; message: string }
  | { kind: "error" }

const { pushMock, getRefreshTokenMock, createEmployeeMock } = vi.hoisted(() => ({
  pushMock: vi.fn<(href: string) => void>(),
  getRefreshTokenMock: vi.fn<() => string | null>(),
  createEmployeeMock: vi.fn<(payload: Record<string, unknown>) => Promise<CreateEmployeeResult>>(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}))

vi.mock("../../lib/auth/token-store", () => ({
  getRefreshToken: getRefreshTokenMock,
}))

vi.mock("../../lib/api/employees-client", () => ({
  createEmployee: createEmployeeMock,
}))

describe("Employee create page", () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  const fillRequiredFields = () => {
    fireEvent.change(screen.getByRole("textbox", { name: /full name/i }), {
      target: { value: "Ada Lovelace" },
    })
    fireEvent.change(screen.getByRole("textbox", { name: /employee code/i }), {
      target: { value: "EMP-0001" },
    })
    fireEvent.change(screen.getByRole("textbox", { name: /job title/i }), {
      target: { value: "Staff Engineer" },
    })
    fireEvent.change(screen.getByRole("textbox", { name: /country/i }), {
      target: { value: "IN" },
    })
    fireEvent.change(screen.getByRole("combobox", { name: /employment type/i }), {
      target: { value: "full_time" },
    })
    fireEvent.change(screen.getByRole("combobox", { name: /status/i }), {
      target: { value: "active" },
    })
    fireEvent.change(screen.getByRole("spinbutton", { name: /salary/i }), {
      target: { value: "50000" },
    })
    fireEvent.change(screen.getByLabelText(/effective from/i), {
      target: { value: "2024-01-01" },
    })
  }

  it("creates employee and navigates to detail page after successful submit", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    createEmployeeMock.mockResolvedValueOnce({
      kind: "created",
      employeeCode: "EMP-0001",
    })

    render(<EmployeeCreatePage />)

    fillRequiredFields()
    fireEvent.click(screen.getByRole("button", { name: /create employee/i }))

    await waitFor(() => {
      expect(createEmployeeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: "Ada Lovelace",
          employeeCode: "EMP-0001",
        }),
      )
    })

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/employees/EMP-0001")
    })
  })

  it("shows inline client-side validation messages and prevents submit when required fields are missing", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")

    render(<EmployeeCreatePage />)

    fireEvent.click(screen.getByRole("button", { name: /create employee/i }))

    expect(await screen.findByText(/full name must be at least 2 characters/i)).toBeVisible()
    expect(screen.getByText(/use emp- followed by at least 4 digits/i)).toBeVisible()
    expect(screen.getByText(/job title must be at least 2 characters/i)).toBeVisible()
    expect(createEmployeeMock).not.toHaveBeenCalled()
    expect(pushMock).not.toHaveBeenCalled()
  })

  it("shows field validation messages when create returns 422 mapped errors", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    createEmployeeMock.mockResolvedValueOnce({
      kind: "validation-error",
      fieldErrors: {
        fullName: "can't be blank",
        salary: "must be greater than 0",
      },
    })

    render(<EmployeeCreatePage />)

    fillRequiredFields()
    fireEvent.click(screen.getByRole("button", { name: /create employee/i }))

    expect(await screen.findByText("can't be blank")).toBeVisible()
    expect(screen.getByText(/must be greater than 0/i)).toBeVisible()
    expect(pushMock).not.toHaveBeenCalled()
  })

  it("shows duplicate employee code message when create returns 409", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    createEmployeeMock.mockResolvedValueOnce({
      kind: "duplicate-employee-code",
      message: "Employee code has already been taken",
    })

    render(<EmployeeCreatePage />)

    fillRequiredFields()
    fireEvent.click(screen.getByRole("button", { name: /create employee/i }))

    expect(await screen.findByText(/employee code has already been taken/i)).toBeVisible()
    expect(pushMock).not.toHaveBeenCalled()
  })
})
