"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import {
  getCountryMetrics,
  getDistributionMetrics,
  getSegmentMetrics,
  type CountryMetrics,
  type DistributionMetrics,
  type InsightsFieldErrors,
  type SegmentMetrics,
} from "../../../lib/api/insights-client";
import { getRefreshToken } from "../../../lib/auth/token-store";
import { useProtectedRoute } from "../../../lib/auth/use-protected-route";
import { primaryButtonClassName, secondaryButtonClassName } from "../../../components/ui/button-styles";

const DEFAULT_FILTERS = {
  countryCode: "IN",
  jobTitle: "Software Engineer",
  bucketSize: "1000",
};

type PanelState<TData> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: TData }
  | { status: "error"; message: string };

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

  return <p className="text-xs text-red-700">{message}</p>;
};

const MetricItem = ({ label, value }: { label: string; value: string }) => (
  <div>
    <dt className="text-muted">{label}</dt>
    <dd className="font-medium text-foreground">{value}</dd>
  </div>
);

export default function InsightsPage() {
  useProtectedRoute();

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [fieldErrors, setFieldErrors] = useState<InsightsFieldErrors>({});
  const [countryPanel, setCountryPanel] = useState<PanelState<CountryMetrics>>({ status: "loading" });
  const [segmentPanel, setSegmentPanel] = useState<PanelState<SegmentMetrics>>({ status: "loading" });
  const [distributionPanel, setDistributionPanel] = useState<PanelState<DistributionMetrics>>({ status: "loading" });

  const applyInsights = useCallback(async () => {
    setFieldErrors({});
    setCountryPanel({ status: "loading" });
    setSegmentPanel({ status: "loading" });
    setDistributionPanel({ status: "loading" });

    const normalizedCountryCode = filters.countryCode.trim().toUpperCase();
    const normalizedJobTitle = filters.jobTitle.trim();
    const parsedBucketSize = Number(filters.bucketSize);
    const bucketSize = Number.isFinite(parsedBucketSize) ? parsedBucketSize : undefined;

    const [countryResult, segmentResult, distributionResult] = await Promise.all([
      getCountryMetrics(normalizedCountryCode),
      getSegmentMetrics(normalizedCountryCode, normalizedJobTitle),
      getDistributionMetrics({
        countryCode: normalizedCountryCode,
        jobTitle: normalizedJobTitle,
        bucketSize,
      }),
    ]);

    const nextErrors: InsightsFieldErrors = {};

    if (countryResult.kind === "success") {
      setCountryPanel({ status: "success", data: countryResult.data });
    } else if (countryResult.kind === "validation-error") {
      Object.assign(nextErrors, countryResult.fieldErrors);
      setCountryPanel({ status: "idle" });
    } else {
      setCountryPanel({ status: "error", message: countryResult.message });
    }

    if (segmentResult.kind === "success") {
      setSegmentPanel({ status: "success", data: segmentResult.data });
    } else if (segmentResult.kind === "validation-error") {
      Object.assign(nextErrors, segmentResult.fieldErrors);
      setSegmentPanel({ status: "idle" });
    } else {
      setSegmentPanel({ status: "error", message: segmentResult.message });
    }

    if (distributionResult.kind === "success") {
      setDistributionPanel({ status: "success", data: distributionResult.data });
    } else if (distributionResult.kind === "validation-error") {
      Object.assign(nextErrors, distributionResult.fieldErrors);
      setDistributionPanel({ status: "idle" });
    } else {
      setDistributionPanel({ status: "error", message: distributionResult.message });
    }

    setFieldErrors(nextErrors);
  }, [filters]);

  useEffect(() => {
    if (!getRefreshToken()) {
      return;
    }

    const timer = setTimeout(() => {
      void applyInsights();
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [applyInsights]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void applyInsights();
  };

  const isAnyLoading = useMemo(
    () => countryPanel.status === "loading" || segmentPanel.status === "loading" || distributionPanel.status === "loading",
    [countryPanel.status, distributionPanel.status, segmentPanel.status],
  );

  return (
    <section className="rounded-2xl border border-black/10 bg-surface p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Insights</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Salary Insights Dashboard</h1>

      <form className="mt-6 grid gap-4 rounded-xl border border-black/10 bg-white/40 p-4 md:grid-cols-4" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label htmlFor="insights-country-code" className="text-sm font-medium">Country code</label>
          <input
            id="insights-country-code"
            value={filters.countryCode}
            onChange={(event) => {
              const nextValue = event.currentTarget.value.toUpperCase();
              setFilters((previous) => ({ ...previous, countryCode: nextValue }));
            }}
            className="w-full rounded-md border border-black/10 px-3 py-2 text-sm"
            maxLength={2}
          />
          <FieldError message={fieldErrors.countryCode} />
        </div>

        <div className="space-y-1">
          <label htmlFor="insights-job-title" className="text-sm font-medium">Job title</label>
          <input
            id="insights-job-title"
            value={filters.jobTitle}
            onChange={(event) => {
              const nextValue = event.currentTarget.value;
              setFilters((previous) => ({ ...previous, jobTitle: nextValue }));
            }}
            className="w-full rounded-md border border-black/10 px-3 py-2 text-sm"
            maxLength={120}
          />
          <FieldError message={fieldErrors.jobTitle} />
        </div>

        <div className="space-y-1">
          <label htmlFor="insights-bucket-size" className="text-sm font-medium">Bucket size (USD)</label>
          <input
            id="insights-bucket-size"
            type="number"
            min={1}
            value={filters.bucketSize}
            onChange={(event) => {
              const nextValue = event.currentTarget.value;
              setFilters((previous) => ({ ...previous, bucketSize: nextValue }));
            }}
            className="w-full rounded-md border border-black/10 px-3 py-2 text-sm"
          />
          <FieldError message={fieldErrors.bucketSize} />
        </div>

        <div className="flex items-end gap-2">
          <button type="submit" className={primaryButtonClassName} disabled={isAnyLoading}>
            {isAnyLoading ? "Loading..." : "Run insights"}
          </button>
          <button
            type="button"
            className={secondaryButtonClassName}
            onClick={() => {
              setFilters(DEFAULT_FILTERS);
              setFieldErrors({});
            }}
          >
            Reset
          </button>
        </div>
      </form>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-black/10 bg-white/30 p-4">
          <h2 className="text-sm font-semibold">Country Metrics</h2>
          {countryPanel.status === "loading" ? <p className="mt-3 text-sm text-muted">Loading country metrics...</p> : null}
          {countryPanel.status === "error" ? <p className="mt-3 text-sm text-red-700">{countryPanel.message}</p> : null}
          {countryPanel.status === "success" ? (
            countryPanel.data.count === 0 ? (
              <p className="mt-3 text-sm text-muted">No country data for current filters.</p>
            ) : (
              <dl className="mt-3 space-y-2 text-sm">
                <MetricItem label="Average" value={formatMetric(countryPanel.data.avg)} />
                <MetricItem label="Median" value={formatMetric(countryPanel.data.median)} />
                <MetricItem label="Min" value={formatMetric(countryPanel.data.min)} />
                <MetricItem label="Max" value={formatMetric(countryPanel.data.max)} />
                <MetricItem label="Stddev" value={formatMetric(countryPanel.data.stddev)} />
                <MetricItem label="Count" value={String(countryPanel.data.count)} />
                <MetricItem label="Computed at" value={formatComputedAt(countryPanel.data.computedAt)} />
              </dl>
            )
          ) : null}
        </section>

        <section className="rounded-xl border border-black/10 bg-white/30 p-4">
          <h2 className="text-sm font-semibold">Segment Metrics</h2>
          {segmentPanel.status === "loading" ? <p className="mt-3 text-sm text-muted">Loading segment metrics...</p> : null}
          {segmentPanel.status === "error" ? <p className="mt-3 text-sm text-red-700">{segmentPanel.message}</p> : null}
          {segmentPanel.status === "success" ? (
            segmentPanel.data.count === 0 ? (
              <p className="mt-3 text-sm text-muted">No segment data for current filters.</p>
            ) : (
              <dl className="mt-3 space-y-2 text-sm">
                <MetricItem label="Average" value={formatMetric(segmentPanel.data.avg)} />
                <MetricItem label="Median" value={formatMetric(segmentPanel.data.median)} />
                <MetricItem label="P25" value={formatMetric(segmentPanel.data.p25)} />
                <MetricItem label="P75" value={formatMetric(segmentPanel.data.p75)} />
                <MetricItem label="P90" value={formatMetric(segmentPanel.data.p90)} />
                <MetricItem label="Count" value={String(segmentPanel.data.count)} />
                <MetricItem label="Computed at" value={formatComputedAt(segmentPanel.data.computedAt)} />
              </dl>
            )
          ) : null}
        </section>

        <section className="rounded-xl border border-black/10 bg-white/30 p-4">
          <h2 className="text-sm font-semibold">Distribution</h2>
          {distributionPanel.status === "loading" ? <p className="mt-3 text-sm text-muted">Loading distribution metrics...</p> : null}
          {distributionPanel.status === "error" ? <p className="mt-3 text-sm text-red-700">{distributionPanel.message}</p> : null}
          {distributionPanel.status === "success" ? (
            <>
              {distributionPanel.data.buckets.length === 0 ? (
                <p className="mt-3 text-sm text-muted">No distribution data for current filters.</p>
              ) : (
                <>
                  <p className="mt-3 text-sm text-muted">Bucket size: {formatMetric(distributionPanel.data.bucketSize)}</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {distributionPanel.data.buckets.slice(0, 5).map((bucket) => (
                      <li key={`${bucket.minSalary}-${bucket.maxSalary}`}>
                        {formatMetric(bucket.minSalary)} - {formatMetric(bucket.maxSalary)}: {bucket.count}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                    <div>
                      <p className="font-medium">Top countries</p>
                      <ul className="mt-1 space-y-1 text-muted">
                        {distributionPanel.data.topCountries.map((country) => (
                          <li key={`top-${country.countryCode}`}>
                            {country.countryCode}: {formatMetric(country.averageSalary)}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium">Bottom countries</p>
                      <ul className="mt-1 space-y-1 text-muted">
                        {distributionPanel.data.bottomCountries.map((country) => (
                          <li key={`bottom-${country.countryCode}`}>
                            {country.countryCode}: {formatMetric(country.averageSalary)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-muted">Computed at {formatComputedAt(distributionPanel.data.computedAt)}</p>
                </>
              )}
            </>
          ) : null}
        </section>
      </div>
    </section>
  );
}
