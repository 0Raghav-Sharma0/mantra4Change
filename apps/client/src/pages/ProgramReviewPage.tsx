import { useMemo } from "react";
import { useFilters } from "../context/FilterContext";
import { filtersToChartBody } from "../api/program";
import { FilterBar } from "../components/filters/FilterBar";
import { PlotlyChartCard } from "../components/charts/PlotlyChartCard";
import { KpiGrid } from "../components/kpi/KpiGrid";
import { RiskPanel } from "../components/risk/RiskPanel";
import { GeographyTable } from "../components/tables/GeographyTable";
import { ErrorState, LoadingState } from "../components/ui/StatePanels";
import { NarrativePanel } from "../components/narrative/NarrativePanel";
import { ActionItemsPanel } from "../components/review/ActionItemsPanel";
import { MonthlyReviewSummaryPanel } from "../components/review/MonthlyReviewSummaryPanel";
import { useActionItems } from "../hooks/useActionItems";
import { useChart } from "../hooks/useChart";
import { useMonthlyReview } from "../hooks/useMonthlyReview";
import { useProgramBlocks } from "../hooks/useProgramBlocks";
import { useProgramDashboard } from "../hooks/useProgramDashboard";
import { useProgramDistricts } from "../hooks/useProgramDistricts";
import { useProgramNarrative } from "../hooks/useProgramNarrative";
import { useProgramRisks } from "../hooks/useProgramRisks";
import { useSummaryPreferences } from "../context/SummaryContext";
import { formatMonthLabel } from "../utils/format";

export default function ProgramReviewPage() {
  const { queryFilters } = useFilters();
  const { useEnhancedSummaries } = useSummaryPreferences();

  const dashboard = useProgramDashboard(queryFilters);
  const monthlyReview = useMonthlyReview();
  const actionItems = useActionItems();
  const districts = useProgramDistricts(queryFilters);
  const blocks = useProgramBlocks(queryFilters);
  const risks = useProgramRisks(queryFilters);
  const programReport = useProgramNarrative();

  const chartBody = useMemo(() => filtersToChartBody(queryFilters), [queryFilters]);
  const trendsChart = useChart("program-trends", chartBody);
  const districtChart = useChart("district-performance", chartBody);
  const riskChart = useChart("risk-distribution", chartBody);

  return (
    <div className="page program-review-page">
      <header className="page-header">
        <h2>Program Review</h2>
        <p className="muted">{formatMonthLabel(queryFilters.month)}</p>
      </header>

      <FilterBar />

      <section className="card page-section">
        <div className="section-header">
          <h3>Key indicators</h3>
        </div>
        {dashboard.loading && <LoadingState label="Loading metrics…" inline />}
        {dashboard.error && (
          <ErrorState message={dashboard.error} onRetry={dashboard.reload} inline />
        )}
        {dashboard.data && <KpiGrid metrics={dashboard.data.metrics} />}
      </section>

      <section className="charts-grid charts-section">
        <PlotlyChartCard
          title="Program trends"
          chartType="program-trends"
          chartBody={chartBody}
          chart={trendsChart}
        />
        <PlotlyChartCard
          title="District performance"
          chartType="district-performance"
          chartBody={chartBody}
          chart={districtChart}
        />
        <PlotlyChartCard
          title="Risk distribution"
          chartType="risk-distribution"
          chartBody={chartBody}
          chart={riskChart}
        />
      </section>

      {monthlyReview.loading && (
        <section className="card page-section">
          <LoadingState label="Loading review summary…" inline />
        </section>
      )}
      {monthlyReview.error && (
        <section className="card page-section">
          <ErrorState message={monthlyReview.error} onRetry={monthlyReview.reload} inline />
        </section>
      )}
      {monthlyReview.data && <MonthlyReviewSummaryPanel summary={monthlyReview.data} />}

      {actionItems.loading && (
        <section className="card page-section">
          <LoadingState label="Loading actions…" inline />
        </section>
      )}
      {actionItems.error && (
        <section className="card page-section">
          <ErrorState message={actionItems.error} onRetry={actionItems.reload} inline />
        </section>
      )}
      {actionItems.data && (
        <ActionItemsPanel
          items={actionItems.data.items}
          loading={actionItems.loading}
          onRegenerate={() => void actionItems.regenerate()}
          onStatusChange={(id, status) => void actionItems.setStatus(id, status)}
        />
      )}

      <details className="card details-section">
        <summary>District & block tables</summary>
        <div className="details-section-body">
          {districts.loading && <LoadingState label="Loading districts…" inline />}
          {districts.error && (
            <ErrorState message={districts.error} onRetry={districts.reload} inline />
          )}
          {districts.data && (
            <GeographyTable title="Districts" rows={districts.data.performers.slice(0, 15)} />
          )}

          {blocks.loading && <LoadingState label="Loading blocks…" inline />}
          {blocks.error && <ErrorState message={blocks.error} onRetry={blocks.reload} inline />}
          {blocks.data && (
            <GeographyTable
              title="Blocks"
              rows={blocks.data.performers.slice(0, 20)}
              showDistrict
            />
          )}
        </div>
      </details>

      <details className="card details-section">
        <summary>Risk analysis & written report</summary>
        <div className="details-section-body">
          {risks.loading && <LoadingState label="Loading risk analysis…" inline />}
          {risks.error && <ErrorState message={risks.error} onRetry={risks.reload} inline />}
          {risks.data && <RiskPanel risks={risks.data} />}

          {programReport.loading && (
            <LoadingState
              label={useEnhancedSummaries ? "Writing summary…" : "Loading report…"}
              inline
            />
          )}
          {programReport.error && (
            <ErrorState message={programReport.error} onRetry={programReport.reload} inline />
          )}
          {programReport.data && (
            <NarrativePanel title="Program report" narrative={programReport.data} nested />
          )}
        </div>
      </details>
    </div>
  );
}
