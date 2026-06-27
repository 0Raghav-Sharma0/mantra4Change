import { useState } from "react";
import type { MonthlyReviewSummary } from "@mantra4change/shared-types";
import { RISK_THRESHOLDS } from "@mantra4change/shared-types";
import { RiskBadge } from "../ui/RiskBadge";
import { buildMonthlyReviewMarkdown } from "../../utils/export";

interface MonthlyReviewSummaryPanelProps {
  summary: MonthlyReviewSummary;
}

export function MonthlyReviewSummaryPanel({ summary }: MonthlyReviewSummaryPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyMarkdown = async () => {
    const markdown = buildMonthlyReviewMarkdown(summary);
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="card meeting-summary-panel">
      <div className="section-header meeting-summary-header">
        <div>
          <h3>Monthly review summary</h3>
          <div className="meeting-summary-meta">
            <RiskBadge status={summary.overallRiskStatus} />
            <span className="muted">{summary.reportingMonth}</span>
          </div>
        </div>
        <div className="meeting-summary-actions">
          <button type="button" className="btn-secondary" onClick={handleCopyMarkdown}>
            {copied ? "Copied" : "Copy markdown"}
          </button>
        </div>
      </div>

      <div className="meeting-summary-grid">
        <article className="summary-block">
          <h4>Achievements</h4>
          <ul>
            {summary.achievements.length ? (
              summary.achievements.map((item) => <li key={item}>{item}</li>)
            ) : (
              <li className="muted">No achievements flagged for current thresholds.</li>
            )}
          </ul>
        </article>

        <article className="summary-block">
          <h4>Month-over-month</h4>
          <ul>
            {summary.monthOverMonthChanges.length ? (
              summary.monthOverMonthChanges.map((item) => <li key={item}>{item}</li>)
            ) : (
              <li className="muted">No prior-month comparison available.</li>
            )}
          </ul>
        </article>

        <article className="summary-block">
          <h4>Risks</h4>
          <ul className="risk-summary-list">
            {summary.risks.map((risk) => (
              <li key={risk.indicator}>
                <RiskBadge status={risk.riskStatus} />
                <span>
                  {risk.indicator} · {risk.ratePercent}%
                </span>
              </li>
            ))}
          </ul>
        </article>

        <article className="summary-block">
          <h4>Priority geographies</h4>
          <p className="summary-subheading">Districts</p>
          <ul>
            {summary.priorityDistricts.length ? (
              summary.priorityDistricts.map((item) => <li key={item}>{item}</li>)
            ) : (
              <li className="muted">None flagged</li>
            )}
          </ul>
          <p className="summary-subheading">Blocks</p>
          <ul>
            {summary.priorityBlocks.length ? (
              summary.priorityBlocks.map((item) => <li key={item}>{item}</li>)
            ) : (
              <li className="muted">None flagged</li>
            )}
          </ul>
        </article>

        <article className="summary-block summary-block-wide">
          <h4>Discussion prompts</h4>
          <ol>
            {summary.discussionPrompts.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
          <p className="muted threshold-note">
            Thresholds: On Track ≥ {RISK_THRESHOLDS.ON_TRACK_MIN}%, Behind ≥{" "}
            {RISK_THRESHOLDS.BEHIND_MIN}%, At Risk ≥ {RISK_THRESHOLDS.AT_RISK_MIN}%.
          </p>
        </article>
      </div>
    </section>
  );
}
