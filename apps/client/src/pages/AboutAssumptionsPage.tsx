import { RISK_THRESHOLDS } from "@mantra4change/shared-types";

export default function AboutAssumptionsPage() {
  return (
    <div className="page about-page">
      <header className="page-header">
        <h2>Assumptions</h2>
        <p className="muted">Data rules and risk thresholds used in this dashboard.</p>
      </header>

      <section className="card">
        <h3>Data</h3>
        <ul>
          <li>CSV data is synthetic sample data for demo purposes.</li>
          <li>One school response row per school per reporting month (Jul–Sep 2025).</li>
          <li>Participation, evidence, and attendance rates are stored as decimals (0–1).</li>
          <li>Default month is September 2025 when not specified.</li>
        </ul>
      </section>

      <section className="card">
        <h3>Risk thresholds</h3>
        <dl className="assumptions-dl">
          <div>
            <dt>On Track</dt>
            <dd>&ge; {RISK_THRESHOLDS.ON_TRACK_MIN}%</dd>
          </div>
          <div>
            <dt>Behind</dt>
            <dd>
              {RISK_THRESHOLDS.BEHIND_MIN}% – {RISK_THRESHOLDS.ON_TRACK_MIN - 1}%
            </dd>
          </div>
          <div>
            <dt>At Risk</dt>
            <dd>
              {RISK_THRESHOLDS.AT_RISK_MIN}% – {RISK_THRESHOLDS.BEHIND_MIN - 1}%
            </dd>
          </div>
          <div>
            <dt>Critical</dt>
            <dd>&lt; {RISK_THRESHOLDS.AT_RISK_MIN}%</dd>
          </div>
        </dl>
      </section>

      <section className="card">
        <h3>Stack</h3>
        <ul>
          <li>Node/Express API with MongoDB for program and grant data.</li>
          <li>Python/FastAPI service for chart aggregations.</li>
          <li>React frontend — metrics come from the API, not computed in the browser.</li>
          <li>
            Optional smart summaries: set <code>GEMINI_API_KEY</code> or <code>AI_API_KEY</code> in{" "}
            <code>apps/server/.env</code> (see README).
          </li>
        </ul>
      </section>
    </div>
  );
}
