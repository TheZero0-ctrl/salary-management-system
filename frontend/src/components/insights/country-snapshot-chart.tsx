"use client";

import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";

type CountrySnapshotChartProps = {
  min: number | null;
  median: number | null;
  avg: number | null;
  max: number | null;
};

const formatCompact = (value: number) =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

export const CountrySnapshotChart = ({ min, median, avg, max }: CountrySnapshotChartProps) => {
  const data = [
    { label: "Min", value: min ?? 0 },
    { label: "Median", value: median ?? 0 },
    { label: "Average", value: avg ?? 0 },
    { label: "Max", value: max ?? 0 },
  ];

  return (
    <div className="rounded-lg border border-black/10 bg-white/85 p-4" data-testid="country-snapshot-chart">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Compensation spread</p>
        <p className="rounded-full border border-black/10 bg-white px-2 py-0.5 text-[11px] text-muted">USD</p>
      </div>
      <p className="mt-1 text-xs text-muted">Read left to right: lowest, midpoint, average, and highest salaries.</p>
      <div className="mt-3 w-full overflow-x-auto">
        <BarChart width={760} height={260} data={data} margin={{ top: 8, right: 14, left: 0, bottom: 20 }}>
          <defs>
            <linearGradient id="countrySnapshotBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1f2529" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#1f2529" stopOpacity={0.65} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" stroke="rgba(31,37,41,0.12)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#5f6a72", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            height={44}
            label={{ value: "Metric", position: "bottom", offset: 0, fill: "#5f6a72", fontSize: 11 }}
          />
          <YAxis tickFormatter={formatCompact} tick={{ fill: "#5f6a72", fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(value) => new Intl.NumberFormat("en-US").format(Number(value))}
            cursor={{ fill: "rgba(31,37,41,0.05)" }}
            contentStyle={{ borderRadius: 8, border: "1px solid rgba(31,37,41,0.12)", background: "#fffdf9" }}
          />
          <Bar dataKey="value" fill="url(#countrySnapshotBar)" radius={[6, 6, 0, 0]} maxBarSize={96} />
        </BarChart>
      </div>
    </div>
  );
};
