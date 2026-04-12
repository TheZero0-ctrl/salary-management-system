import { beforeEach, describe, expect, it, vi } from "vitest"

const authClientMocks = vi.hoisted(() => ({
  authorizedFetch: vi.fn(),
}))

const baseUrlMocks = vi.hoisted(() => ({
  getBackendApiBaseUrl: vi.fn<() => string>(),
}))

vi.mock("../auth-client", () => authClientMocks)
vi.mock("../base-url", () => baseUrlMocks)

const loadInsightsClient = () => import("../insights-client")

describe("insights-client", () => {
  const backendBaseUrl = "http://backend.test"

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    baseUrlMocks.getBackendApiBaseUrl.mockReturnValue(backendBaseUrl)
  })

  it("calls countries endpoint with country_code query", async () => {
    authClientMocks.authorizedFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { count: 0 } }),
    })

    const client = (await loadInsightsClient()) as {
      getCountryMetrics: (countryCode: string) => Promise<unknown>
    }

    await client.getCountryMetrics("US")

    expect(authClientMocks.authorizedFetch).toHaveBeenCalledWith(
      `${backendBaseUrl}/api/v1/insights/countries?country_code=US`,
    )
  })

  it("maps countries success payload to frontend shape", async () => {
    authClientMocks.authorizedFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          min: 1000,
          max: 5000,
          avg: 2500,
          median: 2200,
          stddev: 700,
          count: 3,
          computed_at: "2026-04-12T08:00:00Z",
        },
      }),
    })

    const client = (await loadInsightsClient()) as {
      getCountryMetrics: (countryCode: string) => Promise<unknown>
    }

    const result = await client.getCountryMetrics("US")

    expect(result).toEqual({
      kind: "success",
      data: {
        min: 1000,
        max: 5000,
        avg: 2500,
        median: 2200,
        stddev: 700,
        count: 3,
        computedAt: "2026-04-12T08:00:00Z",
      },
    })
  })

  it("maps 422 details to camelCase field errors", async () => {
    authClientMocks.authorizedFetch.mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        error: {
          details: [
            { field: "country_code", message: "must be a valid ISO alpha-2 code" },
            { field: "job_title", message: "can't be blank" },
          ],
        },
      }),
    })

    const client = (await loadInsightsClient()) as {
      getSegmentMetrics: (countryCode: string, jobTitle: string) => Promise<unknown>
    }

    const result = await client.getSegmentMetrics("usa", "")

    expect(result).toEqual({
      kind: "validation-error",
      fieldErrors: {
        countryCode: "must be a valid ISO alpha-2 code",
        jobTitle: "can't be blank",
      },
    })
  })

  it("maps 400 distribution bucket_size error to field errors", async () => {
    authClientMocks.authorizedFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: {
          details: [{ field: "bucket_size", message: "must be greater than or equal to 1" }],
        },
      }),
    })

    const client = (await loadInsightsClient()) as {
      getDistributionMetrics: (query: Record<string, unknown>) => Promise<unknown>
    }

    const result = await client.getDistributionMetrics({ bucketSize: 0 })

    expect(result).toEqual({
      kind: "validation-error",
      fieldErrors: {
        bucketSize: "must be greater than or equal to 1",
      },
    })
  })

  it("maps distribution response lists and bucket ranges", async () => {
    authClientMocks.authorizedFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          bucket_size: 1000,
          buckets: [{ min_salary: 0, max_salary: 999.99, count: 2 }],
          top_countries: [{ country_code: "DE", avg_salary: 4000 }],
          bottom_countries: [{ country_code: "IN", avg_salary: 850 }],
          computed_at: "2026-04-12T08:00:00Z",
        },
      }),
    })

    const client = (await loadInsightsClient()) as {
      getDistributionMetrics: (query: Record<string, unknown>) => Promise<unknown>
    }

    const result = await client.getDistributionMetrics({ countryCode: "US", jobTitle: "Engineer", bucketSize: 1000 })

    expect(authClientMocks.authorizedFetch).toHaveBeenCalledWith(
      `${backendBaseUrl}/api/v1/insights/distributions?country_code=US&job_title=Engineer&bucket_size=1000`,
    )
    expect(result).toEqual({
      kind: "success",
      data: {
        bucketSize: 1000,
        buckets: [{ minSalary: 0, maxSalary: 999.99, count: 2 }],
        topCountries: [{ countryCode: "DE", averageSalary: 4000 }],
        bottomCountries: [{ countryCode: "IN", averageSalary: 850 }],
        computedAt: "2026-04-12T08:00:00Z",
      },
    })
  })
})
