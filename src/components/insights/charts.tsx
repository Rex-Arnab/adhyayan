"use client";

import { Chart, SERIES_COLORS } from "@/components/insights/chart";

export function FunnelChart({ data }: { data: { stage: string; users: number }[] }) {
  const top = data[0]?.users || 1;
  return (
    <Chart
      options={{
        chart: { type: "bar", height: 240 },
        xAxis: { categories: data.map((d) => d.stage) },
        yAxis: { max: top },
        tooltip: {
          formatter() {
            const point = this as unknown as { y?: number; category?: string };
            const pct = Math.round(((point.y ?? 0) / top) * 1000) / 10;
            return `<b>${point.category}</b><br/>${point.y} learners (${pct}% of registered)`;
          },
        },
        plotOptions: {
          bar: { borderRadius: 6, colorByPoint: true, dataLabels: { enabled: true } },
        },
        series: [{ type: "bar", name: "Learners", data: data.map((d) => d.users) }],
      }}
    />
  );
}

export function CtrChart({
  data,
  label,
}: {
  data: { key: string; shown: number; clicked: number; ctr: number }[];
  label: string;
}) {
  return (
    <Chart
      options={{
        chart: { type: "column", height: 260 },
        xAxis: { categories: data.map((d) => d.key) },
        yAxis: [
          { title: { text: undefined }, labels: { format: "{value}" } },
          { title: { text: undefined }, labels: { format: "{value}%" }, opposite: true },
        ],
        tooltip: { shared: true },
        series: [
          { type: "column", name: "Shown", data: data.map((d) => d.shown), borderRadius: 5 },
          { type: "column", name: "Clicked", data: data.map((d) => d.clicked), borderRadius: 5 },
          {
            type: "line",
            name: `CTR by ${label}`,
            yAxis: 1,
            data: data.map((d) => d.ctr),
            color: SERIES_COLORS[3],
            marker: { radius: 4 },
          },
        ],
      }}
    />
  );
}

export function EventsChart({
  data,
}: {
  data: { date: string; type: string; count: number }[];
}) {
  const dates = [...new Set(data.map((d) => d.date))].sort();
  // Heartbeats outnumber everything ~10:1 and would flatten the rest.
  const types = [...new Set(data.map((d) => d.type))]
    .filter((t) => t !== "CHAPTER_HEARTBEAT")
    .slice(0, 6);

  return (
    <Chart
      options={{
        chart: { type: "areaspline", height: 280 },
        xAxis: { categories: dates },
        plotOptions: {
          areaspline: { stacking: "normal", marker: { enabled: false }, fillOpacity: 0.55 },
        },
        series: types.map((type) => ({
          type: "areaspline" as const,
          name: type,
          data: dates.map(
            (d) => data.find((r) => r.date === d && r.type === type)?.count ?? 0,
          ),
        })),
      }}
    />
  );
}

export function SessionDistributionChart({
  data,
}: {
  data: { label: string; sessions: number }[];
}) {
  return (
    <Chart
      options={{
        chart: { type: "column", height: 240 },
        xAxis: { categories: data.map((d) => d.label), title: { text: "Chapters per session" } },
        plotOptions: { column: { borderRadius: 5 } },
        series: [{ type: "column", name: "Sessions", data: data.map((d) => d.sessions) }],
      }}
    />
  );
}

export function EngagementChart({
  data,
}: {
  data: { title: string; avgMinutes: number }[];
}) {
  return (
    <Chart
      options={{
        chart: { type: "bar", height: 340 },
        xAxis: {
          categories: data.map((d) => d.title),
          labels: { style: { fontSize: "10px" } },
        },
        yAxis: { labels: { format: "{value} min" } },
        plotOptions: { bar: { borderRadius: 5 } },
        series: [
          { type: "bar", name: "Average minutes", data: data.map((d) => d.avgMinutes) },
        ],
      }}
    />
  );
}

export function FeatureWeightChart({
  data,
}: {
  data: { feature: string; weight: number }[];
}) {
  return (
    <Chart
      options={{
        chart: { type: "bar", height: 320 },
        xAxis: { categories: data.map((d) => d.feature), labels: { style: { fontSize: "10px" } } },
        yAxis: { plotLines: [{ value: 0, width: 1, color: "#5B5866" }] },
        plotOptions: {
          bar: {
            borderRadius: 5,
            // Sign matters: a negative weight pushes a candidate DOWN.
            colorByPoint: false,
            zones: [
              { value: 0, color: SERIES_COLORS[1] },
              { color: SERIES_COLORS[0] },
            ],
          },
        },
        series: [{ type: "bar", name: "Learned weight", data: data.map((d) => d.weight) }],
      }}
    />
  );
}
