import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import InsightsPage from "../(workspace)/insights/page"

type CountryMetricsResult =
  | {
      kind: "success"
      data: {
        min: number | null
        max: number | null
        avg: number | null
        median: number | null
        stddev: number | null
        count: number
        computedAt: string | null
      }
    }
  | { kind: "validation-error"; fieldErrors: Record<string, string> }
  | { kind: "error"; message: string }

type SegmentMetricsResult =
  | {
      kind: "success"
      data: {
        min: number | null
        max: number | null
        avg: number | null
        median: number | null
        p25: number | null
        p75: number | null
        p90: number | null
        count: number
        computedAt: string | null
      }
    }
  | { kind: "validation-error"; fieldErrors: Record<string, string> }
  | { kind: "error"; message: string }

type DistributionMetricsResult =
  | {
      kind: "success"
      data: {
        bucketSize: number
        buckets: Array<{ minSalary: number; maxSalary: number; count: number }>
        topCountries: Array<{ countryCode: string; averageSalary: number }>
        bottomCountries: Array<{ countryCode: string; averageSalary: number }>
        computedAt: string | null
      }
    }
  | { kind: "validation-error"; fieldErrors: Record<string, string> }
  | { kind: "error"; message: string }

const {
  pushMock,
  getRefreshTokenMock,
  getCountryMetricsMock,
  getSegmentMetricsMock,
  getDistributionMetricsMock,
} = vi.hoisted(() => ({
  pushMock: vi.fn<(href: string) => void>(),
  getRefreshTokenMock: vi.fn<() => string | null>(),
  getCountryMetricsMock: vi.fn<(countryCode: string) => Promise<CountryMetricsResult>>(),
  getSegmentMetricsMock: vi.fn<(countryCode: string, jobTitle: string) => Promise<SegmentMetricsResult>>(),
  getDistributionMetricsMock: vi.fn<(query: Record<string, unknown>) => Promise<DistributionMetricsResult>>(),
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

const mockSuccessfulPanels = () => {
  getCountryMetricsMock.mockResolvedValue({
    kind: "success",
    data: {
      min: 1000,
      max: 5000,
      avg: 2500,
      median: 2200,
      stddev: 700,
      count: 5,
      computedAt: "2026-04-12T08:00:00Z",
    },
  })

  getSegmentMetricsMock.mockResolvedValue({
    kind: "success",
    data: {
      min: 1000,
      max: 5000,
      avg: 2600,
      median: 2400,
      p25: 1800,
      p75: 3200,
      p90: 4200,
      count: 5,
      computedAt: "2026-04-12T08:00:00Z",
    },
  })

  getDistributionMetricsMock.mockResolvedValue({
    kind: "success",
    data: {
      bucketSize: 1000,
      buckets: [{ minSalary: 1000, maxSalary: 1999.99, count: 2 }],
      topCountries: [{ countryCode: "US", averageSalary: 4200 }],
      bottomCountries: [{ countryCode: "IN", averageSalary: 850 }],
      computedAt: "2026-04-12T08:00:00Z",
    },
  })
}

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}))

vi.mock("../../lib/auth/token-store", () => ({
  getRefreshToken: getRefreshTokenMock,
}))

vi.mock("../../lib/api/insights-client", () => ({
  getCountryMetrics: getCountryMetricsMock,
  getSegmentMetrics: getSegmentMetricsMock,
  getDistributionMetrics: getDistributionMetricsMock,
}))

describe("Insights page", () => {
  afterEach(() => {
    cleanup()
    vi.resetAllMocks()
  })

  it("shows loading states while metrics requests are pending", () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")

    const countryDeferred = createDeferred<CountryMetricsResult>()
    const segmentDeferred = createDeferred<SegmentMetricsResult>()
    const distributionDeferred = createDeferred<DistributionMetricsResult>()

    getCountryMetricsMock.mockReturnValueOnce(countryDeferred.promise)
    getSegmentMetricsMock.mockReturnValueOnce(segmentDeferred.promise)
    getDistributionMetricsMock.mockReturnValueOnce(distributionDeferred.promise)

    render(<InsightsPage />)

    expect(screen.getByText(/loading country metrics/i)).toBeVisible()
    expect(screen.getByText(/loading segment metrics/i)).toBeVisible()
    expect(screen.getByText(/loading distribution metrics/i)).toBeVisible()
  })

  it("renders all three insights panels on successful responses", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    mockSuccessfulPanels()

    render(<InsightsPage />)

    expect(await screen.findByText("2,500")).toBeVisible()
    expect(screen.getByText("2,600")).toBeVisible()
    expect(screen.getByText(/bucket size: 1,000/i)).toBeVisible()
    expect(screen.getByText(/us: 4,200/i)).toBeVisible()
  })

  it("shows validation messages from backend field errors", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    getCountryMetricsMock.mockResolvedValueOnce({
      kind: "validation-error",
      fieldErrors: { countryCode: "must be a valid ISO alpha-2 code" },
    })
    getSegmentMetricsMock.mockResolvedValueOnce({
      kind: "validation-error",
      fieldErrors: { jobTitle: "can't be blank" },
    })
    getDistributionMetricsMock.mockResolvedValueOnce({
      kind: "validation-error",
      fieldErrors: { bucketSize: "must be greater than or equal to 1" },
    })

    render(<InsightsPage />)

    expect(await screen.findByText(/must be a valid iso alpha-2 code/i)).toBeVisible()
    expect(screen.getByText(/can't be blank/i)).toBeVisible()
    expect(screen.getByText(/must be greater than or equal to 1/i)).toBeVisible()
  })

  it("re-runs queries with updated filters when user submits", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    mockSuccessfulPanels()

    render(<InsightsPage />)

    await screen.findByText(/country metrics/i)

    fireEvent.change(screen.getByLabelText(/country code/i), { target: { value: "us" } })
    fireEvent.change(screen.getByLabelText(/job title/i), { target: { value: "Data Analyst" } })
    fireEvent.change(screen.getByLabelText(/bucket size/i), { target: { value: "2000" } })

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /run insights/i })).toBeEnabled()
    })

    fireEvent.click(screen.getByRole("button", { name: /run insights/i }))

    await waitFor(() => {
      expect(getCountryMetricsMock).toHaveBeenLastCalledWith("US")
      expect(getSegmentMetricsMock).toHaveBeenLastCalledWith("US", "Data Analyst")
      expect(getDistributionMetricsMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          countryCode: "US",
          jobTitle: "Data Analyst",
          bucketSize: 2000,
        }),
      )
    })
  })

  it("shows retryable error state and retries on next submit", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    getCountryMetricsMock
      .mockResolvedValueOnce({ kind: "error", message: "Unable to load insights" })
      .mockResolvedValueOnce({
        kind: "success",
        data: {
          min: 1000,
          max: 5000,
          avg: 2500,
          median: 2200,
          stddev: 700,
          count: 5,
          computedAt: "2026-04-12T08:00:00Z",
        },
      })
    getSegmentMetricsMock
      .mockResolvedValueOnce({ kind: "error", message: "Unable to load insights" })
      .mockResolvedValueOnce({
        kind: "success",
        data: {
          min: 1000,
          max: 5000,
          avg: 2600,
          median: 2400,
          p25: 1800,
          p75: 3200,
          p90: 4200,
          count: 5,
          computedAt: "2026-04-12T08:00:00Z",
        },
      })
    getDistributionMetricsMock
      .mockResolvedValueOnce({ kind: "error", message: "Unable to load insights" })
      .mockResolvedValueOnce({
        kind: "success",
        data: {
          bucketSize: 1000,
          buckets: [{ minSalary: 1000, maxSalary: 1999.99, count: 2 }],
          topCountries: [{ countryCode: "US", averageSalary: 4200 }],
          bottomCountries: [{ countryCode: "IN", averageSalary: 850 }],
          computedAt: "2026-04-12T08:00:00Z",
        },
      })

    render(<InsightsPage />)

    expect(await screen.findAllByText(/unable to load insights/i)).toHaveLength(3)

    fireEvent.click(screen.getByRole("button", { name: /run insights/i }))

    await waitFor(() => {
      expect(getCountryMetricsMock).toHaveBeenCalledTimes(2)
      expect(getSegmentMetricsMock).toHaveBeenCalledTimes(2)
      expect(getDistributionMetricsMock).toHaveBeenCalledTimes(2)
    })

    expect(await screen.findByText("2,500")).toBeVisible()
  })
})
