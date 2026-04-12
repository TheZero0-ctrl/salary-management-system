import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import EmployeeEditPage from "../(workspace)/employees/[employee_code]/edit/page"

type EmployeeDetail = {
  fullName: string
  employeeCode: string
  jobTitle?: string
  country?: string
  department?: string
  employmentType?: string
  salary?: string | number
  status?: string
  effectiveFrom?: string
}

type EmployeeDetailResult =
  | { kind: "found"; employee: EmployeeDetail }
  | { kind: "not-found" }
  | { kind: "error" }

type UpdateEmployeeResult =
  | { kind: "updated" }
  | { kind: "validation-error"; fieldErrors: Record<string, string> }
  | { kind: "duplicate-employee-code"; message: string }
  | { kind: "not-found" }
  | { kind: "error" }

const { pushMock, getRefreshTokenMock, getEmployeeByCodeMock, updateEmployeeMock } = vi.hoisted(() => ({
  pushMock: vi.fn<(href: string) => void>(),
  getRefreshTokenMock: vi.fn<() => string | null>(),
  getEmployeeByCodeMock: vi.fn<(employeeCode: string) => Promise<EmployeeDetailResult>>(),
  updateEmployeeMock: vi.fn<(employeeCode: string, payload: Record<string, unknown>) => Promise<UpdateEmployeeResult>>(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  useParams: () => ({
    employee_code: "EMP-0001",
  }),
}))

vi.mock("../../lib/auth/token-store", () => ({
  getRefreshToken: getRefreshTokenMock,
}))

vi.mock("../../lib/api/employees-client", () => ({
  getEmployeeByCode: getEmployeeByCodeMock,
  updateEmployee: updateEmployeeMock,
}))

describe("Employee edit page", () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it("prefills form inputs from fetched employee data", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    getEmployeeByCodeMock.mockResolvedValueOnce({
      kind: "found",
      employee: {
        fullName: "Ada Lovelace",
        employeeCode: "EMP-0001",
        jobTitle: "Staff Engineer",
        country: "IN",
        department: "Engineering",
        employmentType: "full_time",
        salary: 50000,
        status: "active",
        effectiveFrom: "2024-01-01",
      },
    })

    render(<EmployeeEditPage />)

    expect(await screen.findByRole("textbox", { name: /full name/i })).toHaveValue("Ada Lovelace")
    expect(screen.getByRole("textbox", { name: /employee code/i })).toHaveValue("EMP-0001")
    expect(screen.getByRole("textbox", { name: /department/i })).toHaveValue("Engineering")
  })

  it("submits edited values and navigates back to detail on update success", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    getEmployeeByCodeMock.mockResolvedValueOnce({
      kind: "found",
      employee: {
        fullName: "Ada Lovelace",
        employeeCode: "EMP-0001",
        jobTitle: "Staff Engineer",
        country: "IN",
        employmentType: "full_time",
        salary: 50000,
        status: "active",
        effectiveFrom: "2024-01-01",
      },
    })
    updateEmployeeMock.mockResolvedValueOnce({ kind: "updated" })

    render(<EmployeeEditPage />)

    const fullNameInput = await screen.findByRole("textbox", { name: /full name/i })
    fireEvent.change(fullNameInput, { target: { value: "Ada Byron" } })
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }))

    await waitFor(() => {
      expect(updateEmployeeMock).toHaveBeenCalledWith(
        "EMP-0001",
        expect.objectContaining({ fullName: "Ada Byron" }),
      )
    })

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/employees/EMP-0001")
    })
  })

  it("shows error feedback and stays on page when update fails", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    getEmployeeByCodeMock.mockResolvedValueOnce({
      kind: "found",
      employee: {
        fullName: "Ada Lovelace",
        employeeCode: "EMP-0001",
        jobTitle: "Staff Engineer",
        country: "IN",
        employmentType: "full_time",
        salary: 50000,
        status: "active",
        effectiveFrom: "2024-01-01",
      },
    })
    updateEmployeeMock.mockResolvedValueOnce({ kind: "error" })

    render(<EmployeeEditPage />)

    fireEvent.click(await screen.findByRole("button", { name: /save changes/i }))

    expect(await screen.findByText(/unable to update employee/i)).toBeVisible()
    expect(pushMock).not.toHaveBeenCalledWith("/employees/EMP-0001")
  })

  it("shows duplicate employee code message when update returns 409", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    getEmployeeByCodeMock.mockResolvedValueOnce({
      kind: "found",
      employee: {
        fullName: "Ada Lovelace",
        employeeCode: "EMP-0001",
        jobTitle: "Staff Engineer",
        country: "IN",
        employmentType: "full_time",
        salary: 50000,
        status: "active",
        effectiveFrom: "2024-01-01",
      },
    })
    updateEmployeeMock.mockResolvedValueOnce({
      kind: "duplicate-employee-code",
      message: "Employee code has already been taken",
    })

    render(<EmployeeEditPage />)

    fireEvent.click(await screen.findByRole("button", { name: /save changes/i }))

    expect(await screen.findByText(/employee code has already been taken/i)).toBeVisible()
    expect(pushMock).not.toHaveBeenCalledWith("/employees/EMP-0001")
  })
})
