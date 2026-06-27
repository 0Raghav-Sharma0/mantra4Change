import type { GrantReportResponse } from "@mantra4change/shared-types";

export function GrantReportPreview({ report }: { report: GrantReportResponse }) {
  return (
    <section className="card grant-report-preview">
      <div className="section-header">
        <h3>Report preview</h3>
      </div>
      <div className="report-text">{report.narrative}</div>
    </section>
  );
}
