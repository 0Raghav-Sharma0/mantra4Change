import { useState } from "react";
import Plot from "react-plotly.js";
import type { Data } from "plotly.js";
import type { ChartFilterRequest, ChartResponse } from "@mantra4change/shared-types";
import { downloadChartPng, type ChartType } from "../../api/charts";
import {
  buildEmbeddedChartLayout,
  chartContainerHeight,
  normalizeChartData,
} from "../../utils/chartLayout";
import { EmptyState, ErrorState, LoadingState } from "../ui/StatePanels";

interface PlotlyChartCardProps {
  title: string;
  chartType: ChartType;
  chartBody: ChartFilterRequest;
  chart: {
    data: ChartResponse | null;
    loading: boolean;
    error: string | null;
    reload: () => void;
  };
}

function barCountFromFigure(data: Data[]): number {
  for (const trace of data) {
    if (trace.type !== "bar") continue;
    const barTrace = trace as Data & { orientation?: string; y?: unknown; x?: unknown };
    if (barTrace.orientation === "h" && Array.isArray(barTrace.y)) return barTrace.y.length;
    if (Array.isArray(barTrace.x)) return barTrace.x.length;
  }
  return 10;
}

export function PlotlyChartCard({ title, chartType, chartBody, chart }: PlotlyChartCardProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const shellClass = `chart-card card chart-card--${chartType}`;

  if (chart.loading) {
    return (
      <article className={shellClass}>
        <h3>{title}</h3>
        <LoadingState label={`Loading ${title.toLowerCase()}…`} inline />
      </article>
    );
  }
  if (chart.error) {
    return (
      <article className={shellClass}>
        <h3>{title}</h3>
        <ErrorState message={chart.error} onRetry={chart.reload} inline />
      </article>
    );
  }
  if (!chart.data) {
    return (
      <article className={shellClass}>
        <EmptyState title={`${title} unavailable`} inline />
      </article>
    );
  }
  if (chart.data.isEmpty) {
    return (
      <article className={shellClass}>
        <EmptyState
          title="No chart data"
          description="No data for the current filters."
          inline
        />
      </article>
    );
  }

  const figure = chart.data.plotlyFigure;
  const rawData = (figure.data as Data[]) ?? [];
  const barCount = barCountFromFigure(rawData);
  const plotData = normalizeChartData(chartType, rawData);
  const layout = buildEmbeddedChartLayout(chartType, figure.layout ?? {}, { barCount });
  const containerHeight = chartContainerHeight(chartType, barCount);

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      const slug = title.toLowerCase().replace(/\s+/g, "-");
      await downloadChartPng(chartType, chartBody, `${slug}.png`);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <article className={shellClass}>
      <div className="section-header chart-card-header">
        <h3>{title}</h3>
        <button type="button" className="btn-secondary btn-sm" onClick={handleDownload} disabled={downloading}>
          {downloading ? "Downloading…" : "PNG"}
        </button>
      </div>
      {downloadError && <p className="muted chart-download-error">{downloadError}</p>}
      <div
        className={`chart-container chart-container--${chartType}`}
        style={{ height: containerHeight }}
      >
        <Plot
          data={plotData}
          layout={layout}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: "100%", height: "100%" }}
          useResizeHandler
        />
      </div>
    </article>
  );
}
