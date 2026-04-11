import { beforeEach, describe, expect, it, vi } from "vitest"

const authClientMocks = vi.hoisted(() => ({
  authorizedFetch: vi.fn(),
}))

const baseUrlMocks = vi.hoisted(() => ({
  getBackendApiBaseUrl: vi.fn<() => string>(),
}))

vi.mock("../auth-client", () => authClientMocks)
vi.mock("../base-url", () => baseUrlMocks)

const loadEmployeesClient = () => import("../employees-client")

describe("listEmployees query mapping", () => {
  const backendBaseUrl = "http://backend.test"

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    baseUrlMocks.getBackendApiBaseUrl.mockReturnValue(backendBaseUrl)
    authClientMocks.authorizedFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    })
  })

  it("maps UI query options to backend query params in request URL", async () => {
    const { listEmployees } = await loadEmployeesClient()

    await (listEmployees as unknown as (query: Record<string, unknown>) => Promise<unknown>)({
      search: "alice",
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

    expect(authClientMocks.authorizedFetch).toHaveBeenCalledWith(
      `${backendBaseUrl}/api/v1/employees?search=alice&country_code=IN&department=Engineering&status=active&salary_min=5000&salary_max=10000&sort_by=full_name&sort_direction=asc&page=2&per_page=25`,
    )
  })

  it("omits empty or undefined query values from the request URL", async () => {
    const { listEmployees } = await loadEmployeesClient()

    await (listEmployees as unknown as (query: Record<string, unknown>) => Promise<unknown>)({
      search: "",
      countryCode: undefined,
      department: "Engineering",
      status: "active",
      salaryMin: undefined,
      salaryMax: undefined,
      sortBy: "",
      sortDirection: undefined,
      page: undefined,
      perPage: undefined,
    })

    expect(authClientMocks.authorizedFetch).toHaveBeenCalledWith(
      `${backendBaseUrl}/api/v1/employees?department=Engineering&status=active`,
    )
  })

  it("returns pagination meta parsed from backend response", async () => {
    authClientMocks.authorizedFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          {
            full_name: "Ada Lovelace",
            employee_code: "EMP-0001",
          },
        ],
        meta: {
          page: 2,
          per_page: 25,
          total_count: 112,
          total_pages: 5,
        },
      }),
    })

    const { listEmployees } = await loadEmployeesClient()

    const result = await (listEmployees as unknown as () => Promise<unknown>)()

    expect(result).toEqual({
      data: [
        {
          fullName: "Ada Lovelace",
          employeeCode: "EMP-0001",
          id: undefined,
          jobTitle: undefined,
          country: undefined,
          department: undefined,
          employmentType: undefined,
          salary: undefined,
          status: undefined,
          effectiveFrom: undefined,
          hireDate: undefined,
          lastSalaryReviewDate: undefined,
        },
      ],
      meta: {
        page: 2,
        perPage: 25,
        totalCount: 112,
        totalPages: 5,
      },
    })
  })
})

describe("getEmployeeByCode detail mapping", () => {
  const backendBaseUrl = "http://backend.test"

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    baseUrlMocks.getBackendApiBaseUrl.mockReturnValue(backendBaseUrl)
  })

  it("calls the employee detail endpoint with employee code", async () => {
    authClientMocks.authorizedFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          full_name: "Ada Lovelace",
          employee_code: "EMP-0001",
        },
      }),
    })

    const { getEmployeeByCode } = await loadEmployeesClient()

    await (getEmployeeByCode as unknown as (employeeCode: string) => Promise<unknown>)("EMP-0001")

    expect(authClientMocks.authorizedFetch).toHaveBeenCalledWith(`${backendBaseUrl}/api/v1/employees/EMP-0001`)
  })

  it("maps backend snake_case detail response to frontend employee shape", async () => {
    authClientMocks.authorizedFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          id: 1,
          full_name: "Ada Lovelace",
          employee_code: "EMP-0001",
          job_title: "Staff Engineer",
          country_code: "IN",
          department: "Engineering",
          employment_type: "full_time",
          salary: 175000,
          status: "active",
          effective_from: "2026-01-01",
          hire_date: "2024-04-01",
          last_salary_review_date: "2025-12-15",
        },
      }),
    })

    const { getEmployeeByCode } = await loadEmployeesClient()

    const result = await (getEmployeeByCode as unknown as (employeeCode: string) => Promise<unknown>)("EMP-0001")

    expect(result).toEqual({
      kind: "found",
      employee: {
        id: 1,
        fullName: "Ada Lovelace",
        employeeCode: "EMP-0001",
        jobTitle: "Staff Engineer",
        country: "IN",
        department: "Engineering",
        employmentType: "full_time",
        salary: 175000,
        status: "active",
        effectiveFrom: "2026-01-01",
        hireDate: "2024-04-01",
        lastSalaryReviewDate: "2025-12-15",
      },
    })
  })

  it("returns distinct not-found outcome when API responds with 404", async () => {
    authClientMocks.authorizedFetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ errors: [{ code: "EMPLOYEE_NOT_FOUND" }] }),
    })

    const { getEmployeeByCode } = await loadEmployeesClient()

    const result = await (getEmployeeByCode as unknown as (employeeCode: string) => Promise<unknown>)("EMP-9999")

    expect(result).toEqual({ kind: "not-found" })
  })

  it("returns distinct error outcome when API responds with non-404 failure", async () => {
    authClientMocks.authorizedFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ errors: [{ code: "INTERNAL_SERVER_ERROR" }] }),
    })

    const { getEmployeeByCode } = await loadEmployeesClient()

    const result = await (getEmployeeByCode as unknown as (employeeCode: string) => Promise<unknown>)("EMP-0001")

    expect(result).toEqual({ kind: "error" })
  })
})
