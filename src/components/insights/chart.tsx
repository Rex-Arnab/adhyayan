"use client";

import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";

/** Categorical palette drawn from the design tokens, in a fixed order. */
export const SERIES_COLORS = ["#A5C8D8", "#E29A4D", "#CBB0EB", "#10242F", "#7FB8A0"];

export function Chart({ options }: { options: Highcharts.Options }) {
  // Seed from a constant: reading the theme during the first render makes SSR
  // and client disagree and React throws a hydration error.
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();
  useEffect(() => setMounted(true), []);

  const dark = mounted && resolvedTheme === "dark";
  const ink = dark ? "#F5F4F7" : "#06040E";
  const muted = dark ? "#A29EB0" : "#5B5866";
  const grid = dark ? "rgba(245,244,247,0.10)" : "rgba(6,4,14,0.08)";

  // Axis options may be a single object OR an array (dual-axis charts).
  // Spreading an array into an object silently turns it into {0:…,1:…}, which
  // destroys the second axis and throws Highcharts error #18 at runtime.
  const mergeAxis = <T,>(base: T, override: T | T[] | undefined): T | T[] => {
    if (Array.isArray(override)) {
      return override.map((axis) => ({ ...base, ...axis }));
    }
    return { ...base, ...(override ?? {}) };
  };

  const merged = useMemo<Highcharts.Options>(
    () => ({
      credits: { enabled: false },
      accessibility: { enabled: false },
      colors: SERIES_COLORS,
      chart: {
        backgroundColor: "transparent",
        style: { fontFamily: "var(--font-sans), system-ui, sans-serif" },
        spacing: [8, 4, 8, 4],
        ...options.chart,
      },
      title: { text: undefined },
      xAxis: mergeAxis(
        {
          lineColor: grid,
          tickColor: grid,
          labels: { style: { color: muted, fontSize: "11px", fontWeight: "600" } },
        },
        options.xAxis as never,
      ),
      yAxis: mergeAxis(
        {
          gridLineColor: grid,
          title: { text: undefined },
          labels: { style: { color: muted, fontSize: "11px" } },
        },
        options.yAxis as never,
      ),
      legend: {
        itemStyle: { color: ink, fontWeight: "600", fontSize: "11px" },
        itemHoverStyle: { color: ink },
      },
      tooltip: {
        backgroundColor: dark ? "#1B1926" : "#FFFFFF",
        borderColor: grid,
        borderRadius: 12,
        style: { color: ink, fontSize: "12px" },
        ...options.tooltip,
      },
      plotOptions: {
        series: { animation: { duration: 180 } },
        ...options.plotOptions,
      },
      series: options.series,
    }),
    [options, dark, ink, muted, grid],
  );

  // Render nothing until mounted so the server and client markup match.
  if (!mounted) return <div className="h-[260px]" aria-hidden />;

  return <HighchartsReact highcharts={Highcharts} options={merged} />;
}

export function ChartCard({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border bg-card p-6">
      <h2 className="font-extrabold tracking-[-0.02em]">{title}</h2>
      {hint ? (
        <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}
