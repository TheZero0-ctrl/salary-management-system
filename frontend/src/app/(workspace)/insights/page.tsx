"use client";

import { useEffect, useState } from "react";

import {
  getCountryMetrics,
  getDistributionMetrics,
  getSegmentMetrics,
  type CountryMetrics,
  type DistributionMetrics,
  type InsightsFieldErrors,
  type SegmentMetrics,
} from "../../../lib/api/insights-client";
import { getEmployeeFilterOptions, type EmployeeFilterOptions } from "../../../lib/api/employees-client";
import { getRefreshToken } from "../../../lib/auth/token-store";
import { useProtectedRoute } from "../../../lib/auth/use-protected-route";
import { primaryButtonClassName, secondaryButtonClassName } from "../../../components/ui/button-styles";
import { CountrySnapshotChart } from "../../../components/insights/country-snapshot-chart";
import { SegmentPercentileChart } from "../../../components/insights/segment-percentile-chart";
import { DistributionCharts } from "../../../components/insights/distribution-charts";

type InsightsTab = "country" | "segment" | "distribution";

type PanelState<TData> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: TData }
  | { status: "error"; message: string };

const defaultFilterOptions: EmployeeFilterOptions = {
  countryCodes: [],
  jobTitles: [],
  departments: [],
};

const defaultCountryFilters = { countryCode: "IN" };
const defaultSegmentFilters = { countryCode: "IN", jobTitle: "" };
const defaultDistributionFilters = { countryCode: "", jobTitle: "", bucketSize: "1000" };

const formatMetric = (value: number | null): string => {
  if (value === null) {
    return "--";
  }

  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
};

const formatComputedAt = (value: string | null): string => {
  if (!value) {
    return "--";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const FieldError = ({ message }: { message?: string }) => {
  if (!message) {
    return null;
  }

  return <p className="mt-1 text-xs text-red-700">{message}</p>;
};

const tabTheme = {
  country: {
    active: "border-black bg-black text-white",
    panel: "border-black/10",
    badge: "bg-black/5 text-foreground",
  },
  segment: {
    active: "border-black bg-black text-white",
    panel: "border-black/10",
    badge: "bg-black/5 text-foreground",
  },
  distribution: {
    active: "border-black bg-black text-white",
    panel: "border-black/10",
    badge: "bg-black/5 text-foreground",
  },
} as const;

export default function InsightsPage() {
  useProtectedRoute();

  const [activeTab, setActiveTab] = useState<InsightsTab>("country");
  const [filterOptions, setFilterOptions] = useState<EmployeeFilterOptions>(defaultFilterOptions);

  const [countryFilters, setCountryFilters] = useState(defaultCountryFilters);
  const [segmentFilters, setSegmentFilters] = useState(defaultSegmentFilters);
  const [distributionFilters, setDistributionFilters] = useState(defaultDistributionFilters);

  const [countryErrors, setCountryErrors] = useState<InsightsFieldErrors>({});
  const [segmentErrors, setSegmentErrors] = useState<InsightsFieldErrors>({});
  const [distributionErrors, setDistributionErrors] = useState<InsightsFieldErrors>({});

  const [countryPanel, setCountryPanel] = useState<PanelState<CountryMetrics>>({ status: "loading" });
  const [segmentPanel, setSegmentPanel] = useState<PanelState<SegmentMetrics>>({ status: "idle" });
  const [distributionPanel, setDistributionPanel] = useState<PanelState<DistributionMetrics>>({ status: "idle" });

  useEffect(() => {
    if (!getRefreshToken()) {
      return;
    }

    let isActive = true;

    const loadFilterOptions = async () => {
      const options = await getEmployeeFilterOptions();

      if (!isActive) {
        return;
      }

      setFilterOptions(options);
    };

    const timer = setTimeout(() => {
      void loadFilterOptions();

      const loadDefaultCountryInsights = async () => {
        setCountryErrors({});
        setCountryPanel({ status: "loading" });

        const result = await getCountryMetrics(defaultCountryFilters.countryCode);

        if (!isActive) {
          return;
        }

        if (result.kind === "success") {
          setCountryPanel({ status: "success", data: result.data });
          return;
        }

        if (result.kind === "validation-error") {
          setCountryErrors(result.fieldErrors);
          setCountryPanel({ status: "idle" });
          return;
        }

        setCountryPanel({ status: "error", message: result.message });
      };

      void loadDefaultCountryInsights();
    }, 0);

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, []);

  const runCountryInsights = async (countryCodeValue: string) => {
    const countryCode = countryCodeValue.trim().toUpperCase();
    setCountryErrors({});
    setCountryPanel({ status: "loading" });

    const result = await getCountryMetrics(countryCode);

    if (result.kind === "success") {
      setCountryPanel({ status: "success", data: result.data });
      return;
    }

    if (result.kind === "validation-error") {
      setCountryErrors(result.fieldErrors);
      setCountryPanel({ status: "idle" });
      return;
    }

    setCountryPanel({ status: "error", message: result.message });
  };

  const runSegmentInsights = async (countryCodeValue: string, jobTitleValue: string) => {
    const countryCode = countryCodeValue.trim().toUpperCase();
    const jobTitle = jobTitleValue.trim();

    setSegmentErrors({});
    setSegmentPanel({ status: "loading" });

    const result = await getSegmentMetrics(countryCode, jobTitle);

    if (result.kind === "success") {
      setSegmentPanel({ status: "success", data: result.data });
      return;
    }

    if (result.kind === "validation-error") {
      setSegmentErrors(result.fieldErrors);
      setSegmentPanel({ status: "idle" });
      return;
    }

    setSegmentPanel({ status: "error", message: result.message });
  };

  const runDistributionInsights = async (
    countryCodeValue: string,
    jobTitleValue: string,
    bucketSizeValue: string,
  ) => {
    const countryCode = countryCodeValue.trim().toUpperCase();
    const jobTitle = jobTitleValue.trim();
    const parsedBucketSize = Number(bucketSizeValue);

    setDistributionErrors({});
    setDistributionPanel({ status: "loading" });

    const result = await getDistributionMetrics({
      countryCode: countryCode === "" ? undefined : countryCode,
      jobTitle: jobTitle === "" ? undefined : jobTitle,
      bucketSize: Number.isFinite(parsedBucketSize) ? parsedBucketSize : undefined,
    });

    if (result.kind === "success") {
      setDistributionPanel({ status: "success", data: result.data });
      return;
    }

    if (result.kind === "validation-error") {
      setDistributionErrors(result.fieldErrors);
      setDistributionPanel({ status: "idle" });
      return;
    }

    setDistributionPanel({ status: "error", message: result.message });
  };

  const tabButtonClassName = (tab: InsightsTab) =>
    activeTab === tab
      ? `inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-semibold shadow-sm ${tabTheme[tab].active}`
      : "inline-flex h-10 items-center justify-center rounded-md border border-black/15 bg-white px-4 text-sm font-semibold text-foreground hover:bg-black/[0.03]";

  const countryLoading = countryPanel.status === "loading";
  const segmentLoading = segmentPanel.status === "loading";
  const distributionLoading = distributionPanel.status === "loading";

  return (
    <section className="relative overflow-hidden rounded-2xl border border-black/10 bg-surface p-5 sm:p-7">
      <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-black/5 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 bottom-0 h-44 w-44 rounded-full bg-black/5 blur-3xl" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Insights</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Salary Insights Dashboard</h1>
          <p className="mt-2 text-sm text-muted">Switch between country, segment, and distribution views with focused filters.</p>
        </div>
        <p className="rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs font-medium text-muted">Live snapshot</p>
      </div>

      <div className="relative mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Insights views">
        <button type="button" role="tab" aria-selected={activeTab === "country"} onClick={() => setActiveTab("country")} className={tabButtonClassName("country")}>
          Country
        </button>
        <button type="button" role="tab" aria-selected={activeTab === "segment"} onClick={() => setActiveTab("segment")} className={tabButtonClassName("segment")}>
          Segment
        </button>
        <button type="button" role="tab" aria-selected={activeTab === "distribution"} onClick={() => setActiveTab("distribution")} className={tabButtonClassName("distribution")}>
          Distribution
        </button>
      </div>

      {activeTab === "country" ? (
        <section className={`mt-4 p-4 ${tabTheme.country.panel}`} role="tabpanel">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tabTheme.country.badge}`}>Country Snapshot</p>
          </div>
          <form
            className="grid gap-3 rounded-lg border border-black/10 bg-white/70 p-3 md:grid-cols-[1fr_auto_auto] md:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              void runCountryInsights(countryFilters.countryCode);
            }}
          >
            <div>
              <label htmlFor="country-tab-country" className="text-sm font-medium">Country code</label>
              <select
                id="country-tab-country"
                value={countryFilters.countryCode}
                onChange={(event) => setCountryFilters({ countryCode: event.currentTarget.value })}
                className="mt-1 h-10 w-full rounded-md border border-black/15 bg-white px-3 text-sm"
              >
                <option value="">Select country</option>
                {filterOptions.countryCodes.map((countryCode) => (
                  <option key={countryCode} value={countryCode}>{countryCode}</option>
                ))}
              </select>
              <FieldError message={countryErrors.countryCode} />
            </div>
            <button type="submit" className={primaryButtonClassName} disabled={countryLoading}>{countryLoading ? "Loading..." : "Run"}</button>
            <button
              type="button"
              className={secondaryButtonClassName}
              onClick={() => {
                setCountryFilters(defaultCountryFilters);
                setCountryErrors({});
              }}
            >
              Reset
            </button>
          </form>
          <p className="mt-3 text-xs text-muted">Tip: use the chart bars to compare spread quickly before checking detailed metrics.</p>

          {countryPanel.status === "loading" ? <p className="mt-4 text-sm text-muted">Loading country metrics...</p> : null}
          {countryPanel.status === "error" ? <p className="mt-4 text-sm text-red-700">{countryPanel.message}</p> : null}
          {countryPanel.status === "success" ? (
            countryPanel.data.count === 0 ? (
              <p className="mt-4 text-sm text-muted">No country data for current filters.</p>
            ) : (
              <>
                <div className="mt-4">
                  <CountrySnapshotChart
                    min={countryPanel.data.min}
                    median={countryPanel.data.median}
                    avg={countryPanel.data.avg}
                    max={countryPanel.data.max}
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
                  <span className="rounded-full border border-black/10 bg-white/80 px-2.5 py-1">Stddev: {formatMetric(countryPanel.data.stddev)}</span>
                  <span className="rounded-full border border-black/10 bg-white/80 px-2.5 py-1">Employees: {countryPanel.data.count}</span>
                  <span className="rounded-full border border-black/10 bg-white/80 px-2.5 py-1">Computed: {formatComputedAt(countryPanel.data.computedAt)}</span>
                </div>
              </>
            )
          ) : null}
        </section>
      ) : null}

      {activeTab === "segment" ? (
        <section className={`mt-4 bg-white/40 p-4 ${tabTheme.segment.panel}`} role="tabpanel">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tabTheme.segment.badge}`}>Role Segment</p>
          </div>
          <form
            className="grid gap-3 rounded-lg border border-black/10 bg-white/70 p-3 md:grid-cols-[1fr_1fr_auto_auto] md:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              void runSegmentInsights(segmentFilters.countryCode, segmentFilters.jobTitle);
            }}
          >
            <div>
              <label htmlFor="segment-tab-country" className="text-sm font-medium">Country code</label>
              <select
                id="segment-tab-country"
                value={segmentFilters.countryCode}
                onChange={(event) => {
                  const nextValue = event.currentTarget.value;
                  setSegmentFilters((previous) => ({ ...previous, countryCode: nextValue }));
                }}
                className="mt-1 h-10 w-full rounded-md border border-black/15 bg-white px-3 text-sm"
              >
                <option value="">Select country</option>
                {filterOptions.countryCodes.map((countryCode) => (
                  <option key={countryCode} value={countryCode}>{countryCode}</option>
                ))}
              </select>
              <FieldError message={segmentErrors.countryCode} />
            </div>

            <div>
              <label htmlFor="segment-tab-job-title" className="text-sm font-medium">Job title</label>
              <select
                id="segment-tab-job-title"
                value={segmentFilters.jobTitle}
                onChange={(event) => {
                  const nextValue = event.currentTarget.value;
                  setSegmentFilters((previous) => ({ ...previous, jobTitle: nextValue }));
                }}
                className="mt-1 h-10 w-full rounded-md border border-black/15 bg-white px-3 text-sm"
              >
                <option value="">Select job title</option>
                {filterOptions.jobTitles.map((jobTitle) => (
                  <option key={jobTitle} value={jobTitle}>{jobTitle}</option>
                ))}
              </select>
              <FieldError message={segmentErrors.jobTitle} />
            </div>

            <button type="submit" className={primaryButtonClassName} disabled={segmentLoading}>{segmentLoading ? "Loading..." : "Run"}</button>
            <button
              type="button"
              className={secondaryButtonClassName}
              onClick={() => {
                setSegmentFilters(defaultSegmentFilters);
                setSegmentErrors({});
              }}
            >
              Reset
            </button>
          </form>
          <p className="mt-3 text-xs text-muted">Tip: wider gaps between percentile bars indicate higher compensation variance in this segment.</p>

          {segmentPanel.status === "loading" ? <p className="mt-4 text-sm text-muted">Loading segment metrics...</p> : null}
          {segmentPanel.status === "error" ? <p className="mt-4 text-sm text-red-700">{segmentPanel.message}</p> : null}
          {segmentPanel.status === "success" ? (
            segmentPanel.data.count === 0 ? (
              <p className="mt-4 text-sm text-muted">No segment data for current filters.</p>
            ) : (
              <>
                <div className="mt-4">
                  <SegmentPercentileChart
                    p25={segmentPanel.data.p25}
                    median={segmentPanel.data.median}
                    p75={segmentPanel.data.p75}
                    p90={segmentPanel.data.p90}
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
                  <span className="rounded-full border border-black/10 bg-white/80 px-2.5 py-1">Average: {formatMetric(segmentPanel.data.avg)}</span>
                  <span className="rounded-full border border-black/10 bg-white/80 px-2.5 py-1">Range: {formatMetric(segmentPanel.data.min)} - {formatMetric(segmentPanel.data.max)}</span>
                  <span className="rounded-full border border-black/10 bg-white/80 px-2.5 py-1">Computed: {formatComputedAt(segmentPanel.data.computedAt)}</span>
                </div>
              </>
            )
          ) : null}
        </section>
      ) : null}

      {activeTab === "distribution" ? (
        <section className={`mt-4 bg-white/40 p-4 ${tabTheme.distribution.panel}`} role="tabpanel">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tabTheme.distribution.badge}`}>Salary Distribution</p>
          </div>
          <form
            className="grid gap-3 rounded-lg border border-black/10 bg-white/70 p-3 md:grid-cols-[1fr_1fr_1fr_auto_auto] md:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              void runDistributionInsights(
                distributionFilters.countryCode,
                distributionFilters.jobTitle,
                distributionFilters.bucketSize,
              );
            }}
          >
            <div>
              <label htmlFor="distribution-tab-country" className="text-sm font-medium">Country code (optional)</label>
              <select
                id="distribution-tab-country"
                value={distributionFilters.countryCode}
                onChange={(event) => {
                  const nextValue = event.currentTarget.value;
                  setDistributionFilters((previous) => ({ ...previous, countryCode: nextValue }));
                }}
                className="mt-1 h-10 w-full rounded-md border border-black/15 bg-white px-3 text-sm"
              >
                <option value="">All countries</option>
                {filterOptions.countryCodes.map((countryCode) => (
                  <option key={countryCode} value={countryCode}>{countryCode}</option>
                ))}
              </select>
              <FieldError message={distributionErrors.countryCode} />
            </div>

            <div>
              <label htmlFor="distribution-tab-job-title" className="text-sm font-medium">Job title (optional)</label>
              <select
                id="distribution-tab-job-title"
                value={distributionFilters.jobTitle}
                onChange={(event) => {
                  const nextValue = event.currentTarget.value;
                  setDistributionFilters((previous) => ({ ...previous, jobTitle: nextValue }));
                }}
                className="mt-1 h-10 w-full rounded-md border border-black/15 bg-white px-3 text-sm"
              >
                <option value="">All job titles</option>
                {filterOptions.jobTitles.map((jobTitle) => (
                  <option key={jobTitle} value={jobTitle}>{jobTitle}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="distribution-tab-bucket-size" className="text-sm font-medium">Bucket size (USD)</label>
              <input
                id="distribution-tab-bucket-size"
                type="number"
                min={1}
                value={distributionFilters.bucketSize}
                onChange={(event) => {
                  const nextValue = event.currentTarget.value;
                  setDistributionFilters((previous) => ({ ...previous, bucketSize: nextValue }));
                }}
                className="mt-1 h-10 w-full rounded-md border border-black/15 bg-white px-3 text-sm"
              />
              <FieldError message={distributionErrors.bucketSize} />
            </div>

            <button type="submit" className={primaryButtonClassName} disabled={distributionLoading}>{distributionLoading ? "Loading..." : "Run"}</button>
            <button
              type="button"
              className={secondaryButtonClassName}
              onClick={() => {
                setDistributionFilters(defaultDistributionFilters);
                setDistributionErrors({});
              }}
            >
              Reset
            </button>
          </form>
          <p className="mt-3 text-xs text-muted">Tip: adjust bucket size to zoom in/out on salary concentration patterns.</p>

          {distributionPanel.status === "loading" ? <p className="mt-4 text-sm text-muted">Loading distribution metrics...</p> : null}
          {distributionPanel.status === "error" ? <p className="mt-4 text-sm text-red-700">{distributionPanel.message}</p> : null}
          {distributionPanel.status === "success" ? (
            distributionPanel.data.buckets.length === 0 ? (
              <p className="mt-4 text-sm text-muted">No distribution data for current filters.</p>
            ) : (
              <>
                <p className="mt-4 rounded-md bg-white/70 px-3 py-2 text-sm text-muted">Bucket size: {formatMetric(distributionPanel.data.bucketSize)}</p>
                <div className="mt-3">
                  <DistributionCharts
                    buckets={distributionPanel.data.buckets}
                    topCountries={distributionPanel.data.topCountries}
                    bottomCountries={distributionPanel.data.bottomCountries}
                  />
                </div>
                <p className="mt-3 text-xs text-muted">Computed at {formatComputedAt(distributionPanel.data.computedAt)}</p>
              </>
            )
          ) : null}
        </section>
      ) : null}
    </section>
  );
}
