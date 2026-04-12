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

describe("createEmployee mutation mapping", () => {
  const backendBaseUrl = "http://backend.test"

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    baseUrlMocks.getBackendApiBaseUrl.mockReturnValue(backendBaseUrl)
  })

  it("posts snake_case payload to create employee endpoint", async () => {
    authClientMocks.authorizedFetch.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        data: {
          full_name: "Ada Lovelace",
          employee_code: "EMP-0001",
        },
      }),
    })

    const employeesClient = (await loadEmployeesClient()) as {
      createEmployee: (payload: Record<string, unknown>) => Promise<unknown>
    }

    await employeesClient.createEmployee({
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
    })

    expect(authClientMocks.authorizedFetch).toHaveBeenCalledWith(
      `${backendBaseUrl}/api/v1/employees`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          employee: {
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
      }),
    )
  })

  it("returns field-level validation errors for 422 create response", async () => {
    authClientMocks.authorizedFetch.mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        errors: [
          {
            field: "full_name",
            message: "can't be blank",
          },
          {
            field: "salary",
            message: "must be greater than 0",
          },
        ],
      }),
    })

    const employeesClient = (await loadEmployeesClient()) as {
      createEmployee: (payload: Record<string, unknown>) => Promise<unknown>
    }

    const result = await employeesClient.createEmployee({
      fullName: "",
      employeeCode: "EMP-0001",
    })

    expect(result).toEqual({
      kind: "validation-error",
      fieldErrors: {
        fullName: "can't be blank",
        salary: "must be greater than 0",
      },
    })
  })

  it("returns duplicate-code outcome for 409 create response", async () => {
    authClientMocks.authorizedFetch.mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        errors: [
          {
            code: "EMPLOYEE_CODE_TAKEN",
            message: "Employee code has already been taken",
          },
        ],
      }),
    })

    const employeesClient = (await loadEmployeesClient()) as {
      createEmployee: (payload: Record<string, unknown>) => Promise<unknown>
    }

    const result = await employeesClient.createEmployee({
      fullName: "Ada Lovelace",
      employeeCode: "EMP-0001",
    })

    expect(result).toEqual({
      kind: "duplicate-employee-code",
      message: "Employee code has already been taken",
    })
  })
})

describe("updateEmployee mutation mapping", () => {
  const backendBaseUrl = "http://backend.test"

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    baseUrlMocks.getBackendApiBaseUrl.mockReturnValue(backendBaseUrl)
  })

  it("patches employee endpoint with mapped snake_case payload", async () => {
    authClientMocks.authorizedFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          full_name: "Ada Lovelace",
          employee_code: "EMP-0001",
        },
      }),
    })

    const employeesClient = (await loadEmployeesClient()) as {
      updateEmployee: (employeeCode: string, payload: Record<string, unknown>) => Promise<unknown>
    }

    await employeesClient.updateEmployee("EMP-0001", {
      fullName: "Ada Lovelace",
      department: "Platform",
      status: "active",
    })

    expect(authClientMocks.authorizedFetch).toHaveBeenCalledWith(
      `${backendBaseUrl}/api/v1/employees/EMP-0001`,
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          employee: {
            full_name: "Ada Lovelace",
            department: "Platform",
            status: "active",
          },
        }),
      }),
    )
  })

  it("returns not-found outcome for 404 update response", async () => {
    authClientMocks.authorizedFetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({
        errors: [{ code: "EMPLOYEE_NOT_FOUND" }],
      }),
    })

    const employeesClient = (await loadEmployeesClient()) as {
      updateEmployee: (employeeCode: string, payload: Record<string, unknown>) => Promise<unknown>
    }

    const result = await employeesClient.updateEmployee("EMP-9999", {
      fullName: "Ada Lovelace",
    })

    expect(result).toEqual({ kind: "not-found" })
  })

  it("returns generic error outcome for non-404 update failures", async () => {
    authClientMocks.authorizedFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        errors: [{ code: "INTERNAL_SERVER_ERROR" }],
      }),
    })

    const employeesClient = (await loadEmployeesClient()) as {
      updateEmployee: (employeeCode: string, payload: Record<string, unknown>) => Promise<unknown>
    }

    const result = await employeesClient.updateEmployee("EMP-0001", {
      fullName: "Ada Lovelace",
    })

    expect(result).toEqual({ kind: "error" })
  })

  it("maps 422 update response to validation-error with camelCase fields", async () => {
    authClientMocks.authorizedFetch.mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        errors: [
          { field: "full_name", message: "can't be blank" },
          { field: "salary", message: "must be greater than 0" },
        ],
      }),
    })

    const employeesClient = (await loadEmployeesClient()) as {
      updateEmployee: (employeeCode: string, payload: Record<string, unknown>) => Promise<unknown>
    }

    const result = await employeesClient.updateEmployee("EMP-0001", {
      fullName: "",
    })

    expect(result).toEqual({
      kind: "validation-error",
      fieldErrors: {
        fullName: "can't be blank",
        salary: "must be greater than 0",
      },
    })
  })

  it("maps 409 update response to duplicate-employee-code outcome", async () => {
    authClientMocks.authorizedFetch.mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        errors: [{ message: "Employee code has already been taken" }],
      }),
    })

    const employeesClient = (await loadEmployeesClient()) as {
      updateEmployee: (employeeCode: string, payload: Record<string, unknown>) => Promise<unknown>
    }

    const result = await employeesClient.updateEmployee("EMP-0001", {
      employeeCode: "EMP-0002",
    })

    expect(result).toEqual({
      kind: "duplicate-employee-code",
      message: "Employee code has already been taken",
    })
  })
})

describe("deleteEmployeeByCode mutation mapping", () => {
  const backendBaseUrl = "http://backend.test"

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    baseUrlMocks.getBackendApiBaseUrl.mockReturnValue(backendBaseUrl)
  })

  it("sends DELETE request to employee endpoint", async () => {
    authClientMocks.authorizedFetch.mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => ({}),
    })

    const employeesClient = (await loadEmployeesClient()) as {
      deleteEmployeeByCode: (employeeCode: string) => Promise<unknown>
    }

    await employeesClient.deleteEmployeeByCode("EMP-0001")

    expect(authClientMocks.authorizedFetch).toHaveBeenCalledWith(
      `${backendBaseUrl}/api/v1/employees/EMP-0001`,
      expect.objectContaining({ method: "DELETE" }),
    )
  })

  it("returns not-found outcome for 404 delete response", async () => {
    authClientMocks.authorizedFetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({
        errors: [{ code: "EMPLOYEE_NOT_FOUND" }],
      }),
    })

    const employeesClient = (await loadEmployeesClient()) as {
      deleteEmployeeByCode: (employeeCode: string) => Promise<unknown>
    }

    const result = await employeesClient.deleteEmployeeByCode("EMP-9999")

    expect(result).toEqual({ kind: "not-found" })
  })
})
