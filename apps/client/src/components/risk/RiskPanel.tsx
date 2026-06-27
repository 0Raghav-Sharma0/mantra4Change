import type { ProgramRisksResponse, RiskIndicatorResult } from "@mantra4change/shared-types";
import { formatPercent } from "../../utils/format";
import { RiskBadge } from "../ui/RiskBadge";
import { EmptyState } from "../ui/StatePanels";

function indicatorLabel(indicator: RiskIndicatorResult["indicator"]): string {
  if (indicator === "participation") return "Participation";
  if (indicator === "evidence") return "Evidence submission";
  if (indicator === "attendance") return "Attendance";
  return "Composite score";
}

export function RiskPanel({ risks }: { risks: ProgramRisksResponse }) {
  if (risks.overall.length === 0) {
    return (
      <EmptyState
        title="No risk data"
        description="Risk indicators are unavailable for the current filter selection."
      />
    );
  }

  return (
    <section className="risk-panel">
      <header className="section-header risk-panel-header">
        <div>
          <h3>Risk &amp; Gap Analysis</h3>
          <p className="muted">Risk by indicator · scope: {risks.scope}</p>
        </div>
        <div className="overall-risk">
          <span className="muted">Overall status</span>
          <RiskBadge status={risks.overallRiskStatus} />
        </div>
      </header>

      <div className="risk-indicators">
        {risks.overall.map((indicator) => (
          <article key={indicator.indicator} className="risk-card">
            <div className="risk-card-top">
              <h3>{indicatorLabel(indicator.indicator)}</h3>
              <RiskBadge status={indicator.riskStatus} />
            </div>
            <p className="risk-rate">{formatPercent(indicator.rate)}</p>
            <p className="risk-explanation">{indicator.explanation}</p>
          </article>
        ))}
      </div>

      {risks.geographies.length > 0 && (
        <div className="risk-geographies">
          <h3>Priority geographies</h3>
          <ul className="risk-geo-list">
            {risks.geographies.slice(0, 8).map((geo) => (
              <li key={geo.name} className="risk-geo-item">
                <div>
                  <strong>{geo.name}</strong>
                  <span className="muted">
                    {geo.level} · {geo.schoolCount} schools
                  </span>
                </div>
                <RiskBadge status={geo.overallRiskStatus} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
