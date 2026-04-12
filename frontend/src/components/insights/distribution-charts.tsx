"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type DistributionBucket = {
  minSalary: number;
  maxSalary: number;
  count: number;
};

type CountryBand = {
  countryCode: string;
  averageSalary: number;
};

type DistributionChartsProps = {
  buckets: DistributionBucket[];
  topCountries: CountryBand[];
  bottomCountries: CountryBand[];
};

const formatCompact = (value: number) =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

const toBucketLabel = (minSalary: number, maxSalary: number) => `${formatCompact(minSalary)}-${formatCompact(maxSalary)}`;

export const DistributionCharts = ({ buckets, topCountries, bottomCountries }: DistributionChartsProps) => {
  const histogramData = buckets.map((bucket) => ({
    bucket: toBucketLabel(bucket.minSalary, bucket.maxSalary),
    count: bucket.count,
  }));
  const histogramWidth = Math.max(760, histogramData.length * 94);

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <div className="rounded-lg border border-black/10 bg-white/85 p-4 lg:col-span-2" data-testid="distribution-histogram-chart">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Salary histogram</p>
          <div className="flex items-center gap-1 rounded-full border border-black/10 bg-white px-2 py-0.5 text-[11px] text-muted">
            <span className="inline-block h-2 w-2 rounded-full bg-black" aria-hidden="true" />
            Employees per bucket
          </div>
        </div>
        <p className="mt-1 text-xs text-muted">Each bar shows how many employees fall in a salary range.</p>
        <div className="mt-3 w-full overflow-x-auto">
          <BarChart width={histogramWidth} height={290} data={histogramData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="distributionHistogramBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1f2529" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#1f2529" stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(31,37,41,0.12)" vertical={false} />
            <XAxis dataKey="bucket" tick={{ fill: "#5f6a72", fontSize: 11 }} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={50} label={{ value: "Salary bucket", position: "insideBottom", dy: 18, fill: "#5f6a72", fontSize: 11 }} />
            <YAxis tick={{ fill: "#5f6a72", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: "rgba(31,37,41,0.05)" }}
              contentStyle={{ borderRadius: 8, border: "1px solid rgba(31,37,41,0.12)", background: "#fffdf9" }}
            />
            <Bar dataKey="count" fill="url(#distributionHistogramBar)" radius={[6, 6, 0, 0]} maxBarSize={52} />
          </BarChart>
        </div>
      </div>

      <div className="grid gap-3">
        <div className="rounded-lg border border-black/10 bg-white/85 p-4" data-testid="distribution-top-countries-chart">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Top countries</p>
          <p className="mt-1 text-xs text-muted">Highest average salary by country.</p>
          <div className="mt-3 w-full overflow-x-auto">
            <BarChart width={320} height={130} data={topCountries} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="topCountriesBar" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#1f2529" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#1f2529" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <XAxis type="number" hide />
              <YAxis dataKey="countryCode" type="category" tick={{ fill: "#5f6a72", fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
              <Tooltip
                formatter={(value) => new Intl.NumberFormat("en-US").format(Number(value))}
                cursor={{ fill: "rgba(31,37,41,0.05)" }}
                contentStyle={{ borderRadius: 8, border: "1px solid rgba(31,37,41,0.12)", background: "#fffdf9" }}
              />
              <Bar dataKey="averageSalary" fill="url(#topCountriesBar)" radius={4} />
            </BarChart>
          </div>
        </div>

        <div className="rounded-lg border border-black/10 bg-white/85 p-4" data-testid="distribution-bottom-countries-chart">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Bottom countries</p>
          <p className="mt-1 text-xs text-muted">Lowest average salary by country.</p>
          <div className="mt-3 w-full overflow-x-auto">
            <BarChart width={320} height={130} data={bottomCountries} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="bottomCountriesBar" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#5f6a72" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#5f6a72" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <XAxis type="number" hide />
              <YAxis dataKey="countryCode" type="category" tick={{ fill: "#5f6a72", fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
              <Tooltip
                formatter={(value) => new Intl.NumberFormat("en-US").format(Number(value))}
                cursor={{ fill: "rgba(31,37,41,0.05)" }}
                contentStyle={{ borderRadius: 8, border: "1px solid rgba(31,37,41,0.12)", background: "#fffdf9" }}
              />
              <Bar dataKey="averageSalary" fill="url(#bottomCountriesBar)" radius={4} />
            </BarChart>
          </div>
        </div>
      </div>
    </div>
  );
};
