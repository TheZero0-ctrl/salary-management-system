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
})
