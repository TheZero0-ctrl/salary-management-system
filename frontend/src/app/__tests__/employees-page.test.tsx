import { cleanup, fireEvent, render, screen, waitFor, waitForElementToBeRemoved, within } from "@testing-library/react"
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

const { pushMock, useSearchParamsMock, getRefreshTokenMock, listEmployeesMock } = vi.hoisted(() => ({
  pushMock: vi.fn<(href: string) => void>(),
  useSearchParamsMock: vi.fn<() => URLSearchParams>(() => new URLSearchParams()),
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
  useSearchParams: useSearchParamsMock,
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
    useSearchParamsMock.mockImplementation(() => new URLSearchParams())
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

  it("renders employee name as a link to employee detail page", async () => {
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

    const employeeLink = screen.getByRole("link", { name: "Ada Lovelace" })

    expect(employeeLink).toHaveAttribute("href", "/employees/EMP-0001")
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

  it("forwards URL search params to listEmployees on initial load", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    useSearchParamsMock.mockReturnValue(
      new URLSearchParams({
        search: "ada",
        country_code: "IN",
        department: "Engineering",
        status: "active",
        salary_min: "5000",
        salary_max: "10000",
        sort_by: "full_name",
        sort_direction: "asc",
        page: "2",
        per_page: "25",
      }),
    )
    listEmployeesMock.mockResolvedValueOnce([])

    render(<EmployeesPage />)

    await waitFor(() => {
      expect(listEmployeesMock).toHaveBeenCalledWith({
        search: "ada",
        countryCode: "IN",
        department: "Engineering",
        status: "active",
        salaryMin: 5000,
        salaryMax: 10000,
        sortBy: "full_name",
        sortDirection: "asc",
        page: 2,
        perPage: 25,
      })
    })
  })

  it("treats whitespace-only search URL param as blank on initial load", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    useSearchParamsMock.mockReturnValue(
      new URLSearchParams({
        search: "   ",
        country_code: "IN",
      }),
    )
    listEmployeesMock.mockResolvedValueOnce([])

    render(<EmployeesPage />)

    await waitFor(() => {
      expect(listEmployeesMock).toHaveBeenCalled()
    })

    const [filters] = listEmployeesMock.mock.calls[0]

    expect(filters).toEqual(expect.objectContaining({ countryCode: "IN" }))
    expect(filters).not.toHaveProperty("search")
  })

  it("shows a search control and pushes search query on submit", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    listEmployeesMock.mockResolvedValueOnce([])

    render(<EmployeesPage />)

    const searchInput = screen.getByRole("textbox", { name: /search/i })
    const searchButton = screen.getByRole("button", { name: /search/i })

    fireEvent.change(searchInput, { target: { value: "Kai" } })
    fireEvent.click(searchButton)

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/employees?search=Kai")
    })
  })

  it("preserves existing URL params and updates only search on submit", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    useSearchParamsMock.mockReturnValue(
      new URLSearchParams({
        country_code: "IN",
        page: "2",
      }),
    )
    listEmployeesMock.mockResolvedValueOnce([])

    render(<EmployeesPage />)

    const searchInput = screen.getByRole("textbox", { name: /search/i })
    const searchButton = screen.getByRole("button", { name: /search/i })

    fireEvent.change(searchInput, { target: { value: "Kai" } })
    fireEvent.click(searchButton)

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/employees?country_code=IN&search=Kai")
    })
  })

  it("removes page from URL when submitting a new search while preserving non-pagination params", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    useSearchParamsMock.mockReturnValue(
      new URLSearchParams({
        country_code: "IN",
        page: "3",
      }),
    )
    listEmployeesMock.mockResolvedValueOnce([])

    render(<EmployeesPage />)

    const searchInput = screen.getByRole("textbox", { name: /search/i })
    const searchButton = screen.getByRole("button", { name: /search/i })

    fireEvent.change(searchInput, { target: { value: "Kai" } })
    fireEvent.click(searchButton)

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/employees?country_code=IN&search=Kai")
    })
  })

  it("trims leading and trailing whitespace before updating search query on submit", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    useSearchParamsMock.mockReturnValue(
      new URLSearchParams({
        country_code: "IN",
      }),
    )
    listEmployeesMock.mockResolvedValueOnce([])

    render(<EmployeesPage />)

    const searchInput = screen.getByRole("textbox", { name: /search/i })
    const searchButton = screen.getByRole("button", { name: /search/i })

    fireEvent.change(searchInput, { target: { value: "  Kai  " } })
    fireEvent.click(searchButton)

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/employees?country_code=IN&search=Kai")
    })
  })

  it("exposes search, country, department, and status filters and pushes all non-empty params without page on submit", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    useSearchParamsMock.mockReturnValue(
      new URLSearchParams({
        page: "4",
      }),
    )
    listEmployeesMock.mockResolvedValueOnce([])

    render(<EmployeesPage />)

    const searchInput = screen.getByRole("textbox", { name: /search/i })
    const countryControl = screen.getByLabelText(/country/i)
    const departmentControl = screen.getByLabelText(/department/i)
    const statusControl = screen.getByLabelText(/status/i)
    const submitButton = screen.getByRole("button", { name: /search/i })

    fireEvent.change(searchInput, { target: { value: "Kai" } })
    fireEvent.change(countryControl, { target: { value: "IN" } })
    fireEvent.change(departmentControl, { target: { value: "Engineering" } })
    fireEvent.change(statusControl, { target: { value: "active" } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(
        "/employees?search=Kai&country_code=IN&department=Engineering&status=active",
      )
    })
  })

  it("removes search from URL when submitting an empty search while preserving other params", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    useSearchParamsMock.mockReturnValue(
      new URLSearchParams({
        country_code: "IN",
        page: "2",
        search: "Kai",
      }),
    )
    listEmployeesMock.mockResolvedValueOnce([])

    render(<EmployeesPage />)

    const searchInput = screen.getByRole("textbox", { name: /search/i })
    const searchButton = screen.getByRole("button", { name: /search/i })

    fireEvent.change(searchInput, { target: { value: "" } })
    fireEvent.click(searchButton)

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/employees?country_code=IN")
    })
  })

  it("clears filter params and page while preserving non-filter params", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    useSearchParamsMock.mockReturnValue(
      new URLSearchParams({
        search: "Kai",
        country_code: "IN",
        department: "Engineering",
        status: "active",
        page: "3",
        sort_by: "full_name",
      }),
    )
    listEmployeesMock.mockResolvedValueOnce([])

    render(<EmployeesPage />)

    const clearButton = screen.getByRole("button", { name: /clear filters/i })
    fireEvent.click(clearButton)

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/employees?sort_by=full_name")
    })
  })

  it("renders pagination status with Previous and Next controls when pagination meta exists", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    useSearchParamsMock.mockReturnValue(new URLSearchParams({ page: "2" }))
    listEmployeesMock.mockResolvedValueOnce({
      data: [
        {
          fullName: "Ada Lovelace",
          employeeCode: "EMP-0001",
        },
      ],
      meta: {
        page: 2,
        perPage: 25,
        totalCount: 112,
        totalPages: 5,
      },
    } as unknown as Array<EmployeeListItem>)

    render(<EmployeesPage />)

    expect(await screen.findByText(/page 2 of 5/i)).toBeVisible()
    expect(screen.getByRole("button", { name: /previous/i })).toBeVisible()
    expect(screen.getByRole("button", { name: /next/i })).toBeVisible()
  })

  it("clicking Next pushes incremented page while preserving existing query params", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    useSearchParamsMock.mockReturnValue(
      new URLSearchParams({
        search: "ada",
        country_code: "IN",
        page: "2",
      }),
    )
    listEmployeesMock.mockResolvedValueOnce({
      data: [],
      meta: {
        page: 2,
        perPage: 25,
        totalCount: 112,
        totalPages: 5,
      },
    } as unknown as Array<EmployeeListItem>)

    render(<EmployeesPage />)

    fireEvent.click(await screen.findByRole("button", { name: /next/i }))

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/employees?search=ada&country_code=IN&page=3")
    })
  })

  it("clicking Previous pushes decremented page while preserving existing query params", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    useSearchParamsMock.mockReturnValue(
      new URLSearchParams({
        search: "ada",
        country_code: "IN",
        page: "3",
      }),
    )
    listEmployeesMock.mockResolvedValueOnce({
      data: [],
      meta: {
        page: 3,
        perPage: 25,
        totalCount: 112,
        totalPages: 5,
      },
    } as unknown as Array<EmployeeListItem>)

    render(<EmployeesPage />)

    fireEvent.click(await screen.findByRole("button", { name: /previous/i }))

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/employees?search=ada&country_code=IN&page=2")
    })
  })

  it("disables Previous on the first page", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    useSearchParamsMock.mockReturnValue(new URLSearchParams({ page: "1" }))
    listEmployeesMock.mockResolvedValueOnce({
      data: [],
      meta: {
        page: 1,
        perPage: 25,
        totalCount: 112,
        totalPages: 5,
      },
    } as unknown as Array<EmployeeListItem>)

    render(<EmployeesPage />)

    expect(await screen.findByRole("button", { name: /previous/i })).toBeDisabled()
  })

  it("disables Next on the last page", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    useSearchParamsMock.mockReturnValue(new URLSearchParams({ page: "5" }))
    listEmployeesMock.mockResolvedValueOnce({
      data: [],
      meta: {
        page: 5,
        perPage: 25,
        totalCount: 112,
        totalPages: 5,
      },
    } as unknown as Array<EmployeeListItem>)

    render(<EmployeesPage />)

    expect(await screen.findByRole("button", { name: /next/i })).toBeDisabled()
  })

  it("renders a clickable numbered page window around current page and omits pages outside the window", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    useSearchParamsMock.mockReturnValue(new URLSearchParams({ page: "5" }))
    listEmployeesMock.mockResolvedValueOnce({
      data: [],
      meta: {
        page: 5,
        perPage: 25,
        totalCount: 240,
        totalPages: 10,
      },
    } as unknown as Array<EmployeeListItem>)

    render(<EmployeesPage />)

    expect(await screen.findByText(/page 5 of 10/i)).toBeVisible()

    expect(screen.getByRole("button", { name: "3" })).toBeVisible()
    expect(screen.getByRole("button", { name: "4" })).toBeVisible()
    expect(screen.getByRole("button", { name: "5" })).toBeVisible()
    expect(screen.getByRole("button", { name: "6" })).toBeVisible()
    expect(screen.getByRole("button", { name: "7" })).toBeVisible()

    const currentPageButton = screen.getByRole("button", { name: "5" })
    fireEvent.click(currentPageButton)

    const currentPageIsNotClickable =
      currentPageButton.hasAttribute("disabled") || currentPageButton.getAttribute("aria-current") === "page"

    expect(currentPageIsNotClickable).toBe(true)
    expect(pushMock).not.toHaveBeenCalled()

    expect(screen.queryByRole("button", { name: "2" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "8" })).not.toBeInTheDocument()
  })

  it("clicking a numbered page pushes target page while preserving existing query params", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    useSearchParamsMock.mockReturnValue(
      new URLSearchParams({
        search: "ada",
        country_code: "IN",
        page: "5",
        status: "active",
      }),
    )
    listEmployeesMock.mockResolvedValueOnce({
      data: [],
      meta: {
        page: 5,
        perPage: 25,
        totalCount: 240,
        totalPages: 10,
      },
    } as unknown as Array<EmployeeListItem>)

    render(<EmployeesPage />)

    fireEvent.click(await screen.findByRole("button", { name: "4" }))

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/employees?search=ada&country_code=IN&page=4&status=active")
    })
  })
})
