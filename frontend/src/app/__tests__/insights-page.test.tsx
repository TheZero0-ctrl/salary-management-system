import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import InsightsPage from "../(workspace)/insights/page"

const {
  pushMock,
  getRefreshTokenMock,
  getEmployeeFilterOptionsMock,
  getCountryMetricsMock,
  getSegmentMetricsMock,
  getDistributionMetricsMock,
} = vi.hoisted(() => ({
  pushMock: vi.fn<(href: string) => void>(),
  getRefreshTokenMock: vi.fn<() => string | null>(),
  getEmployeeFilterOptionsMock: vi.fn<() => Promise<unknown>>(),
  getCountryMetricsMock: vi.fn<(countryCode: string) => Promise<unknown>>(),
  getSegmentMetricsMock: vi.fn<(countryCode: string, jobTitle: string) => Promise<unknown>>(),
  getDistributionMetricsMock: vi.fn<(query: Record<string, unknown>) => Promise<unknown>>(),
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
  getEmployeeFilterOptions: getEmployeeFilterOptionsMock,
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

  it("loads country tab by default and fetches country metrics", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    getEmployeeFilterOptionsMock.mockResolvedValue({
      countryCodes: ["IN", "US"],
      jobTitles: ["Data Analyst", "Software Engineer"],
      departments: ["Engineering"],
    })
    getCountryMetricsMock.mockResolvedValue({
      kind: "success",
      data: {
        min: 1000,
        max: 5000,
        avg: 2500,
        median: 2200,
        stddev: 600,
        count: 5,
        computedAt: "2026-04-12T08:00:00Z",
      },
    })

    render(<InsightsPage />)

    expect(await screen.findByRole("tab", { name: "Country" })).toHaveAttribute("aria-selected", "true")
    expect(await screen.findByTestId("country-snapshot-chart")).toBeVisible()

    expect(getEmployeeFilterOptionsMock).toHaveBeenCalledTimes(1)
    expect(getCountryMetricsMock).toHaveBeenCalledWith("IN")
  })

  it("shows segment tab controls and submits country + job title", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    getEmployeeFilterOptionsMock.mockResolvedValue({
      countryCodes: ["IN", "US"],
      jobTitles: ["Data Analyst", "Software Engineer"],
      departments: [],
    })
    getCountryMetricsMock.mockResolvedValue({
      kind: "success",
      data: {
        min: null,
        max: null,
        avg: null,
        median: null,
        stddev: null,
        count: 0,
        computedAt: "2026-04-12T08:00:00Z",
      },
    })
    getSegmentMetricsMock.mockResolvedValue({
      kind: "success",
      data: {
        min: 1200,
        max: 5200,
        avg: 2600,
        median: 2400,
        p25: 1800,
        p75: 3200,
        p90: 4000,
        count: 5,
        computedAt: "2026-04-12T08:00:00Z",
      },
    })

    render(<InsightsPage />)
    await screen.findByRole("tab", { name: "Country" })

    fireEvent.click(screen.getByRole("tab", { name: "Segment" }))

    await screen.findByRole("option", { name: "US" })
    await screen.findByRole("option", { name: "Data Analyst" })

    fireEvent.change(screen.getByLabelText(/country code/i), { target: { value: "US" } })
    fireEvent.change(screen.getByLabelText(/job title/i), { target: { value: "Data Analyst" } })
    fireEvent.click(screen.getByRole("button", { name: /^run$/i }))

    await waitFor(() => {
      expect(getSegmentMetricsMock).toHaveBeenLastCalledWith("US", "Data Analyst")
    })

    expect(await screen.findByTestId("segment-percentile-chart")).toBeVisible()
  })

  it("shows distribution tab controls and submits optional filters", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    getEmployeeFilterOptionsMock.mockResolvedValue({
      countryCodes: ["IN", "US"],
      jobTitles: ["Data Analyst", "Software Engineer"],
      departments: [],
    })
    getCountryMetricsMock.mockResolvedValue({
      kind: "success",
      data: {
        min: null,
        max: null,
        avg: null,
        median: null,
        stddev: null,
        count: 0,
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

    render(<InsightsPage />)
    await screen.findByRole("tab", { name: "Country" })

    fireEvent.click(screen.getByRole("tab", { name: "Distribution" }))

    await screen.findByRole("option", { name: "US" })
    await screen.findByRole("option", { name: "Data Analyst" })

    fireEvent.change(screen.getByLabelText(/country code/i), { target: { value: "US" } })
    fireEvent.change(screen.getByLabelText(/job title/i), { target: { value: "Data Analyst" } })
    fireEvent.change(screen.getByLabelText(/bucket size/i), { target: { value: "2000" } })
    fireEvent.click(screen.getByRole("button", { name: /^run$/i }))

    await waitFor(() => {
      expect(getDistributionMetricsMock).toHaveBeenLastCalledWith({
        countryCode: "US",
        jobTitle: "Data Analyst",
        bucketSize: 2000,
      })
    })

    expect(await screen.findByTestId("distribution-histogram-chart")).toBeVisible()
    expect(screen.getByTestId("distribution-top-countries-chart")).toBeVisible()
    expect(screen.getByTestId("distribution-bottom-countries-chart")).toBeVisible()
  })

  it("shows segment validation errors on segment tab", async () => {
    getRefreshTokenMock.mockReturnValue("refresh-token")
    getEmployeeFilterOptionsMock.mockResolvedValue({
      countryCodes: ["IN", "US"],
      jobTitles: ["Data Analyst", "Software Engineer"],
      departments: [],
    })
    getCountryMetricsMock.mockResolvedValue({
      kind: "success",
      data: {
        min: null,
        max: null,
        avg: null,
        median: null,
        stddev: null,
        count: 0,
        computedAt: "2026-04-12T08:00:00Z",
      },
    })
    getSegmentMetricsMock.mockResolvedValue({
      kind: "validation-error",
      fieldErrors: {
        countryCode: "must be a valid ISO alpha-2 code",
        jobTitle: "can't be blank",
      },
    })

    render(<InsightsPage />)
    await screen.findByRole("tab", { name: "Country" })

    fireEvent.click(screen.getByRole("tab", { name: "Segment" }))
    fireEvent.click(screen.getByRole("button", { name: /^run$/i }))

    expect(await screen.findByText(/must be a valid iso alpha-2 code/i)).toBeVisible()
    expect(screen.getByText(/can't be blank/i)).toBeVisible()
  })
})
