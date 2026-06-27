import type { GrantFactsResponse } from "@mantra4change/shared-types";
import { formatNumber, formatPercent } from "../../utils/format";
import { RiskBadge } from "../ui/RiskBadge";

export function GrantFactPanel({ facts }: { facts: GrantFactsResponse }) {
  const p = facts.performance;

  return (
    <section className="card grant-fact-panel">
      <div className="section-header">
        <h3>Grant summary</h3>
        <p className="muted">
          Report status: {facts.reportStatus} · Due {facts.reportDueDate}
        </p>
      </div>

      <div className="fact-grid">
        <article className="fact-item">
          <span className="fact-label">PBL completion</span>
          <strong>{formatPercent(p.pblCompletionRate)}</strong>
          <span className="muted">
            {formatNumber(p.schoolsCompletedPbl)} / {formatNumber(p.sampledSchoolRecords)} schools
          </span>
        </article>
        <article className="fact-item">
          <span className="fact-label">Evidence submission</span>
          <strong>{formatPercent(p.evidenceSubmissionRate)}</strong>
          <span className="muted">{formatNumber(p.schoolsWithEvidence)} schools</span>
        </article>
        <article className="fact-item">
          <span className="fact-label">Attendance</span>
          <strong>{formatPercent(p.attendanceRate)}</strong>
          <span className="muted">
            {formatNumber(p.totalAttendance)} / {formatNumber(p.totalEnrollment)} students
          </span>
        </article>
        <article className="fact-item">
          <span className="fact-label">Program risk</span>
          <RiskBadge status={p.riskStatus} />
        </article>
        <article className="fact-item">
          <span className="fact-label">Aggregate finance utilization</span>
          <strong>{formatPercent(facts.aggregateFinanceUtilization)}</strong>
        </article>
      </div>

      <div className="fact-section">
        <h4>Finance utilization by budget line</h4>
        {facts.finance.length === 0 ? (
          <p className="muted">No finance rows for this grant and month.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Budget line</th>
                  <th>Approved</th>
                  <th>Monthly</th>
                  <th>Cumulative</th>
                  <th>Utilization</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {facts.finance.map((line) => (
                  <tr key={line.budgetLine}>
                    <td>{line.budgetLine}</td>
                    <td>{formatNumber(line.approvedBudgetUnits)}</td>
                    <td>{formatNumber(line.monthlyUtilizedUnits)}</td>
                    <td>{formatNumber(line.cumulativeUtilizedUnits)}</td>
                    <td>{formatPercent(line.cumulativeUtilizationRate)}</td>
                    <td>{line.financeNote}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="fact-section">
        <h4>Milestones</h4>
        {facts.milestones.length === 0 ? (
          <p className="muted">No milestones recorded.</p>
        ) : (
          <ul className="milestone-list">
            {facts.milestones.map((milestone) => (
              <li key={milestone.label}>
                <strong>{milestone.label}</strong>
                <span>
                  {milestone.status} · {milestone.owner}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
