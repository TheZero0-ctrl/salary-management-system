import { cleanup, fireEvent, render, screen, waitFor, waitForElementToBeRemoved, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import EmployeeDetailPage from "../(workspace)/employees/[employee_code]/page"

type EmployeeDetail = {
  id?: number
  fullName: string
  employeeCode: string
  jobTitle?: string
  country?: string
  department?: string
  employmentType?: string
  salary?: number | string
  status?: string
  effectiveFrom?: string
  hireDate?: string
  lastSalaryReviewDate?: string
}

type EmployeeDetailResult =
  | { kind: "found"; employee: EmployeeDetail }
  | { kind: "not-found" }
  | { kind: "error" }

type DeleteEmployeeResult = { kind: "deleted" } | { kind: "not-found" } | { kind: "error" }

const { pushMock, getRefreshTokenMock, getEmployeeByCodeMock, deleteEmployeeByCodeMock } = vi.hoisted(() => ({
  pushMock: vi.fn<(href: string) => void>(),
  getRefreshTokenMock: vi.fn<() => string | null>(),
  getEmployeeByCodeMock: vi.fn<(employeeCode: string) => Promise<EmployeeDetailResult>>(),
  deleteEmployeeByCodeMock: vi.fn<(employeeCode: string) => Promise<DeleteEmployeeResult>>(),
}))

const createDeferred = <T,>() => {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void

  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })

  return { promise, resolve, reject }
}

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
  deleteEmployeeByCode: deleteEmployeeByCodeMock,
}))

describe("Employee detail page", () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it("redirects to /login when refresh token is missing", async () => {
    getRefreshTokenMock.mockReturnValue(null)

    render(<EmployeeDetailPage />)

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/login")
    })
  })

  it("shows loading state first", () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    const detailDeferred = createDeferred<EmployeeDetailResult>()
    getEmployeeByCodeMock.mockReturnValueOnce(detailDeferred.promise)

    render(<EmployeeDetailPage />)

    expect(screen.getByText(/loading employee details/i)).toBeVisible()
  })

  it("renders employee details after successful fetch", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    const detailDeferred = createDeferred<EmployeeDetailResult>()
    getEmployeeByCodeMock.mockReturnValueOnce(detailDeferred.promise)

    render(<EmployeeDetailPage />)

    detailDeferred.resolve({
      kind: "found",
      employee: {
        fullName: "Ada Lovelace",
        employeeCode: "EMP-0001",
        jobTitle: "Staff Engineer",
        country: "IN",
        department: "Engineering",
        status: "active",
      },
    })

    await waitForElementToBeRemoved(() => screen.queryByText(/loading employee details/i))

    expect(screen.getByRole("heading", { name: "Ada Lovelace" })).toBeVisible()
    expect(screen.getByText("EMP-0001")).toBeVisible()
    expect(screen.getByText("Engineering")).toBeVisible()
    expect(screen.getByText("Staff Engineer")).toBeVisible()
  })

  it("shows richer employee metadata labels and values in success state", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    getEmployeeByCodeMock.mockResolvedValueOnce({
      kind: "found",
      employee: {
        fullName: "Ada Lovelace",
        employeeCode: "EMP-0001",
        country: "India",
        status: "Active",
        employmentType: "Full-time",
        salary: "$175,000",
        effectiveFrom: "2026-01-01",
        hireDate: "2024-04-01",
        lastSalaryReviewDate: "2025-12-15",
      },
    })

    render(<EmployeeDetailPage />)

    expect(await screen.findByText("Country")).toBeVisible()
    expect(screen.getByText("India")).toBeVisible()

    expect(screen.getByText("Status")).toBeVisible()
    expect(screen.getByText("Active")).toBeVisible()

    expect(screen.getByText("Employment type")).toBeVisible()
    expect(screen.getByText("Full-time")).toBeVisible()

    expect(screen.getByText("Salary")).toBeVisible()
    expect(screen.getByText("$175,000")).toBeVisible()

    expect(screen.getByText("Effective from")).toBeVisible()
    expect(screen.getByText("2026-01-01")).toBeVisible()

    expect(screen.getByText("Hire date")).toBeVisible()
    expect(screen.getByText("2024-04-01")).toBeVisible()

    expect(screen.getByText("Last salary review date")).toBeVisible()
    expect(screen.getByText("2025-12-15")).toBeVisible()
  })

  it("shows -- for missing optional richer metadata fields", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    getEmployeeByCodeMock.mockResolvedValueOnce({
      kind: "found",
      employee: {
        fullName: "Ada Lovelace",
        employeeCode: "EMP-0001",
      },
    })

    render(<EmployeeDetailPage />)

    expect(await screen.findByText("Country")).toBeVisible()
    expect(screen.getByText("Status")).toBeVisible()
    expect(screen.getByText("Employment type")).toBeVisible()
    expect(screen.getByText("Salary")).toBeVisible()
    expect(screen.getByText("Effective from")).toBeVisible()
    expect(screen.getByText("Hire date")).toBeVisible()
    expect(screen.getByText("Last salary review date")).toBeVisible()

    const countryField = screen.getByText("Country").closest("div")
    const statusField = screen.getByText("Status").closest("div")
    const employmentTypeField = screen.getByText("Employment type").closest("div")
    const salaryField = screen.getByText("Salary").closest("div")
    const effectiveFromField = screen.getByText("Effective from").closest("div")
    const hireDateField = screen.getByText("Hire date").closest("div")
    const lastSalaryReviewDateField = screen.getByText("Last salary review date").closest("div")

    expect(countryField).not.toBeNull()
    expect(statusField).not.toBeNull()
    expect(employmentTypeField).not.toBeNull()
    expect(salaryField).not.toBeNull()
    expect(effectiveFromField).not.toBeNull()
    expect(hireDateField).not.toBeNull()
    expect(lastSalaryReviewDateField).not.toBeNull()

    expect(within(countryField!).getByText("--")).toBeVisible()
    expect(within(statusField!).getByText("--")).toBeVisible()
    expect(within(employmentTypeField!).getByText("--")).toBeVisible()
    expect(within(salaryField!).getByText("--")).toBeVisible()
    expect(within(effectiveFromField!).getByText("--")).toBeVisible()
    expect(within(hireDateField!).getByText("--")).toBeVisible()
    expect(within(lastSalaryReviewDateField!).getByText("--")).toBeVisible()
  })

  it("renders explicit not-found state for missing employee", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    getEmployeeByCodeMock.mockResolvedValueOnce({ kind: "not-found" })

    render(<EmployeeDetailPage />)

    expect(await screen.findByRole("heading", { name: /employee not found/i })).toBeVisible()
    expect(screen.getByText(/could not find an employee with this code/i)).toBeVisible()
  })

  it("shows a return-to-list link in not-found state", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    getEmployeeByCodeMock.mockResolvedValueOnce({ kind: "not-found" })

    render(<EmployeeDetailPage />)

    expect(await screen.findByRole("heading", { name: /employee not found/i })).toBeVisible()
    expect(screen.getByText(/could not find an employee with this code/i)).toBeVisible()

    const returnToListLink = screen.getByRole("link", {
      name: /return to employee list/i,
    })

    expect(returnToListLink).toHaveAttribute("href", "/employees")
  })

  it("renders a user-friendly error state when detail fetch fails", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    getEmployeeByCodeMock.mockResolvedValueOnce({ kind: "error" })

    render(<EmployeeDetailPage />)

    expect(await screen.findByRole("heading", { name: /unable to load employee details/i })).toBeVisible()
    expect(screen.getByText(/please try again in a moment/i)).toBeVisible()
  })

  it("shows a retry button when detail fetch fails", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    getEmployeeByCodeMock.mockResolvedValueOnce({ kind: "error" })

    render(<EmployeeDetailPage />)

    expect(await screen.findByRole("button", { name: /retry/i })).toBeVisible()
  })

  it("retries employee detail fetch and renders success when retry returns found", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    getEmployeeByCodeMock
      .mockResolvedValueOnce({ kind: "error" })
      .mockResolvedValueOnce({
        kind: "found",
        employee: {
          fullName: "Ada Lovelace",
          employeeCode: "EMP-0001",
          jobTitle: "Staff Engineer",
          country: "IN",
          department: "Engineering",
          status: "active",
        },
      })

    render(<EmployeeDetailPage />)

    const retryButton = await screen.findByRole("button", { name: /retry/i })
    fireEvent.click(retryButton)

    await waitFor(() => {
      expect(getEmployeeByCodeMock).toHaveBeenCalledTimes(2)
    })

    expect(await screen.findByRole("heading", { name: "Ada Lovelace" })).toBeVisible()
  })

  it("opens a delete dialog and aborts when user cancels", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    getEmployeeByCodeMock.mockResolvedValueOnce({
      kind: "found",
      employee: {
        fullName: "Ada Lovelace",
        employeeCode: "EMP-0001",
      },
    })

    render(<EmployeeDetailPage />)

    fireEvent.click(await screen.findByRole("button", { name: /delete employee/i }))
    fireEvent.click(await screen.findByRole("button", { name: /cancel/i }))

    expect(deleteEmployeeByCodeMock).not.toHaveBeenCalled()
  })

  it("soft deletes employee and navigates to employees list on success", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    getEmployeeByCodeMock.mockResolvedValueOnce({
      kind: "found",
      employee: {
        fullName: "Ada Lovelace",
        employeeCode: "EMP-0001",
      },
    })
    deleteEmployeeByCodeMock.mockResolvedValueOnce({ kind: "deleted" })

    render(<EmployeeDetailPage />)

    fireEvent.click(await screen.findByRole("button", { name: /delete employee/i }))
    fireEvent.click(await screen.findByRole("button", { name: /^delete$/i }))

    await waitFor(() => {
      expect(deleteEmployeeByCodeMock).toHaveBeenCalledWith("EMP-0001")
    })

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/employees")
    })
  })

  it("renders not-found fallback when soft delete returns 404", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    getEmployeeByCodeMock.mockResolvedValueOnce({
      kind: "found",
      employee: {
        fullName: "Ada Lovelace",
        employeeCode: "EMP-0001",
      },
    })
    deleteEmployeeByCodeMock.mockResolvedValueOnce({ kind: "not-found" })

    render(<EmployeeDetailPage />)

    fireEvent.click(await screen.findByRole("button", { name: /delete employee/i }))
    fireEvent.click(await screen.findByRole("button", { name: /^delete$/i }))

    expect(await screen.findByRole("heading", { name: /employee not found/i })).toBeVisible()
    expect(screen.getByRole("link", { name: /return to employee list/i })).toHaveAttribute("href", "/employees")
  })
})
