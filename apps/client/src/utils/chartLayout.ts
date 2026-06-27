import type { Data, Layout } from "plotly.js";
import type { ChartType } from "../api/charts";

const FONT = {
  family: '"IBM Plex Sans", system-ui, sans-serif',
  size: 11,
  color: "#64748b",
};

const LEGEND_BELOW = {
  orientation: "h" as const,
  yanchor: "top" as const,
  y: -0.22,
  x: 0,
  xanchor: "left" as const,
  font: { size: 10, color: "#64748b" },
  bgcolor: "rgba(255,255,255,0)",
};

function axisTitle(text: string | undefined) {
  if (!text) return undefined;
  return { text, font: { size: 11, color: "#64748b" }, standoff: 10 };
}

export function chartContainerHeight(chartType: ChartType, barCount = 10): number {
  if (chartType === "district-performance") {
    return Math.min(520, Math.max(380, barCount * 34 + 80));
  }
  if (chartType === "grant-utilization") {
    return Math.min(520, Math.max(360, barCount * 22 + 80));
  }
  return 360;
}

export function buildEmbeddedChartLayout(
  chartType: ChartType,
  serverLayout: Partial<Layout>,
  options?: { barCount?: number },
): Partial<Layout> {
  const barCount = options?.barCount ?? 10;
  const height = chartContainerHeight(chartType, barCount);

  const base: Partial<Layout> = {
    ...serverLayout,
    autosize: true,
    height,
    title: undefined,
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    font: FONT,
    showlegend: chartType !== "district-performance",
    legend: LEGEND_BELOW,
    margin: { t: 12, r: 20, b: 72, l: 56 },
  };

  if (chartType === "program-trends") {
    return {
      ...base,
      margin: { t: 12, r: 20, b: 68, l: 52 },
      yaxis: {
        ...(serverLayout.yaxis as Partial<Layout["yaxis"]>),
        range: [0, 100],
        ticksuffix: "%",
        gridcolor: "#e2e8f0",
        zeroline: false,
        automargin: true,
        title: axisTitle("Rate"),
      },
      xaxis: {
        ...(serverLayout.xaxis as Partial<Layout["xaxis"]>),
        title: axisTitle("Month"),
        tickangle: 0,
        automargin: true,
        gridcolor: "#f1f5f9",
      },
    };
  }

  if (chartType === "district-performance") {
    return {
      ...base,
      showlegend: false,
      margin: { t: 12, r: 24, b: 48, l: 96 },
      xaxis: {
        ...(serverLayout.xaxis as Partial<Layout["xaxis"]>),
        title: axisTitle("Composite score (%)"),
        range: [0, 100],
        ticksuffix: "%",
        gridcolor: "#e2e8f0",
        automargin: true,
      },
      yaxis: {
        ...(serverLayout.yaxis as Partial<Layout["yaxis"]>),
        title: undefined,
        tickfont: { size: 11, color: "#334155" },
        automargin: true,
      },
    };
  }

  if (chartType === "risk-distribution") {
    return {
      ...base,
      margin: { t: 12, r: 20, b: 68, l: 52 },
      barmode: "stack",
      xaxis: {
        ...(serverLayout.xaxis as Partial<Layout["xaxis"]>),
        title: axisTitle("Month"),
        type: "category",
        tickangle: 0,
        automargin: true,
      },
      yaxis: {
        ...(serverLayout.yaxis as Partial<Layout["yaxis"]>),
        title: axisTitle("Schools"),
        gridcolor: "#e2e8f0",
        automargin: true,
      },
    };
  }

  return {
    ...base,
    xaxis: {
      ...(serverLayout.xaxis as Partial<Layout["xaxis"]>),
      automargin: true,
      tickangle: -25,
    },
    yaxis: {
      ...(serverLayout.yaxis as Partial<Layout["yaxis"]>),
      automargin: true,
    },
  };
}

/** Strip in-bar tier labels; color already encodes top vs bottom. */
export function normalizeChartData(chartType: ChartType, data: Data[]): Data[] {
  if (chartType !== "district-performance") return data;

  return data.map((trace) => {
    if (trace.type !== "bar") return trace;
    return {
      ...trace,
      text: undefined,
      textposition: undefined,
    };
  });
}
