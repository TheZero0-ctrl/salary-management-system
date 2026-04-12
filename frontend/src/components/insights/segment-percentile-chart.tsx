"use client";

import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";

type SegmentPercentileChartProps = {
  p25: number | null;
  median: number | null;
  p75: number | null;
  p90: number | null;
};

const formatCompact = (value: number) =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

export const SegmentPercentileChart = ({ p25, median, p75, p90 }: SegmentPercentileChartProps) => {
  const data = [
    { label: "P25", value: p25 ?? 0 },
    { label: "P50", value: median ?? 0 },
    { label: "P75", value: p75 ?? 0 },
    { label: "P90", value: p90 ?? 0 },
  ];

  return (
    <div className="rounded-lg border border-black/10 bg-white/85 p-4" data-testid="segment-percentile-chart">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Percentile curve</p>
        <p className="rounded-full border border-black/10 bg-white px-2 py-0.5 text-[11px] text-muted">USD</p>
      </div>
      <p className="mt-1 text-xs text-muted">P50 is the median; compare spread using P25, P75, and P90.</p>
      <div className="mt-3 w-full overflow-x-auto">
        <BarChart width={760} height={260} data={data} margin={{ top: 8, right: 14, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="segmentPercentileBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1f2529" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#1f2529" stopOpacity={0.65} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" stroke="rgba(31,37,41,0.12)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "#5f6a72", fontSize: 12 }} axisLine={false} tickLine={false} label={{ value: "Percentile", position: "insideBottom", dy: 10, fill: "#5f6a72", fontSize: 11 }} />
          <YAxis tickFormatter={formatCompact} tick={{ fill: "#5f6a72", fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(value) => new Intl.NumberFormat("en-US").format(Number(value))}
            cursor={{ fill: "rgba(31,37,41,0.05)" }}
            contentStyle={{ borderRadius: 8, border: "1px solid rgba(31,37,41,0.12)", background: "#fffdf9" }}
          />
          <Bar dataKey="value" fill="url(#segmentPercentileBar)" radius={[6, 6, 0, 0]} maxBarSize={96} />
        </BarChart>
      </div>
    </div>
  );
};
