import { cleanup, render, screen, waitFor, waitForElementToBeRemoved, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import EmployeesPage from "../(workspace)/employees/page"

type EmployeeListItem = {
  fullName: string
  employeeCode: string
  jobTitle?: string
  country?: string
  department?: string
  employmentType?: string
  salary?: string
  status?: string
  effectiveFrom?: string
}

const { pushMock, getRefreshTokenMock, listEmployeesMock } = vi.hoisted(() => ({
  pushMock: vi.fn<(href: string) => void>(),
  getRefreshTokenMock: vi.fn<() => string | null>(),
  listEmployeesMock: vi.fn<() => Promise<Array<EmployeeListItem>>>(),
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
}))

vi.mock("../../lib/auth/token-store", () => ({
  getRefreshToken: getRefreshTokenMock,
}))

vi.mock("../../lib/api/employees-client", () => ({
  listEmployees: listEmployeesMock,
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

  it("shows loading first and then renders employee name and code after data resolves", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")

    const employeesDeferred = createDeferred<Array<EmployeeListItem>>()
    listEmployeesMock.mockReturnValueOnce(employeesDeferred.promise)

    render(<EmployeesPage />)

    expect(screen.getByText(/loading employees/i)).toBeVisible()

    employeesDeferred.resolve([
      {
        fullName: "Ada Lovelace",
        employeeCode: "EMP-0001",
      },
    ])

    await waitForElementToBeRemoved(() => screen.queryByText(/loading employees/i))

    expect(screen.getByText("Ada Lovelace")).toBeVisible()
    expect(screen.getByText("EMP-0001")).toBeVisible()
  })

  it("renders employees in an accessible table with headers after loading", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")

    const employeesDeferred = createDeferred<Array<EmployeeListItem>>()
    listEmployeesMock.mockReturnValueOnce(employeesDeferred.promise)

    render(<EmployeesPage />)

    expect(screen.getByText(/loading employees/i)).toBeVisible()

    employeesDeferred.resolve([
      {
        fullName: "Ada Lovelace",
        employeeCode: "EMP-0001",
      },
    ])

    await waitForElementToBeRemoved(() => screen.queryByText(/loading employees/i))

    expect(screen.getByRole("table")).toBeVisible()
    expect(screen.getByRole("columnheader", { name: "Employee" })).toBeVisible()
    expect(screen.getByRole("columnheader", { name: "Code" })).toBeVisible()
    expect(screen.getByRole("cell", { name: "Ada Lovelace" })).toBeVisible()
    expect(screen.getByRole("cell", { name: "EMP-0001" })).toBeVisible()
  })

  it("renders only primary business columns and one employee row after loading", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")

    const employeesDeferred = createDeferred<Array<EmployeeListItem>>()
    listEmployeesMock.mockReturnValueOnce(employeesDeferred.promise)

    render(<EmployeesPage />)

    expect(screen.getByText(/loading employees/i)).toBeVisible()

    employeesDeferred.resolve([
      {
        fullName: "Ada Lovelace",
        employeeCode: "EMP-0001",
        jobTitle: "Staff Engineer",
        country: "United Kingdom",
        department: "Engineering",
        employmentType: "Full-time",
        salary: "$175,000",
        status: "Active",
        effectiveFrom: "2026-04-01",
      },
    ])

    await waitForElementToBeRemoved(() => screen.queryByText(/loading employees/i))

    expect(screen.getByRole("columnheader", { name: "Employee" })).toBeVisible()
    expect(screen.getByRole("columnheader", { name: "Code" })).toBeVisible()
    expect(screen.getByRole("columnheader", { name: "Department" })).toBeVisible()
    expect(screen.getByRole("columnheader", { name: "Country" })).toBeVisible()
    expect(screen.getByRole("columnheader", { name: "Status" })).toBeVisible()
    expect(screen.queryByRole("columnheader", { name: "Job Title" })).not.toBeInTheDocument()
    expect(screen.queryByRole("columnheader", { name: "Employment Type" })).not.toBeInTheDocument()
    expect(screen.queryByRole("columnheader", { name: "Salary" })).not.toBeInTheDocument()
    expect(screen.queryByRole("columnheader", { name: "Effective From" })).not.toBeInTheDocument()

    const adaRow = screen.getByRole("row", {
      name: /ada lovelace emp-0001 engineering united kingdom active/i,
    })

    expect(within(adaRow).getByRole("cell", { name: "Ada Lovelace" })).toBeVisible()
    expect(within(adaRow).getByRole("cell", { name: "EMP-0001" })).toBeVisible()
    expect(within(adaRow).getByRole("cell", { name: "Engineering" })).toBeVisible()
    expect(within(adaRow).getByRole("cell", { name: "United Kingdom" })).toBeVisible()
    expect(within(adaRow).getByRole("cell", { name: "Active" })).toBeVisible()
  })
})
