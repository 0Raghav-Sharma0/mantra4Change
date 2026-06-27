import type { DashboardMetrics } from "@mantra4change/shared-types";
import { RISK_THRESHOLDS, explainRisk } from "@mantra4change/shared-types";
import { formatNumber, formatPercent } from "../../utils/format";
import { MetricTooltip } from "../ui/MetricTooltip";
import { MomBadge } from "../ui/MomBadge";

interface KpiCardProps {
  label: string;
  value: string;
  subtext?: string;
  mom?: number;
  explain: string;
}

function KpiCard({ label, value, subtext, mom, explain }: KpiCardProps) {
  return (
    <article className="kpi-card">
      <p className="kpi-label">
        {label}
        <MetricTooltip label={label}>{explain}</MetricTooltip>
      </p>
      <p className="kpi-value">{value}</p>
      {subtext && <p className="kpi-subtext">{subtext}</p>}
      <MomBadge delta={mom} />
    </article>
  );
}

const THRESHOLD_TEXT = `Risk bands: On Track ≥ ${RISK_THRESHOLDS.ON_TRACK_MIN}%, Behind ${RISK_THRESHOLDS.BEHIND_MIN}–${RISK_THRESHOLDS.ON_TRACK_MIN - 0.1}%, At Risk ${RISK_THRESHOLDS.AT_RISK_MIN}–${RISK_THRESHOLDS.BEHIND_MIN - 0.1}%, Critical below ${RISK_THRESHOLDS.AT_RISK_MIN}%.`;

export function KpiGrid({ metrics }: { metrics: DashboardMetrics }) {
  const mom = metrics.monthOverMonth;

  return (
    <section className="kpi-grid">
      <KpiCard
        label="Total schools"
        value={formatNumber(metrics.totalSchools)}
        subtext={`${formatNumber(metrics.participatingSchools)} participating`}
        explain="Count of unique schools in the filtered scope for the selected reporting month. Participation subtext shows schools that conducted PBL."
      />
      <KpiCard
        label="Participation rate"
        value={formatPercent(metrics.participationRate)}
        subtext={`${formatNumber(metrics.participatingSchools)} schools conducted PBL`}
        mom={mom.participationRate}
        explain={`${explainRisk("Participation rate", metrics.participationRate)} ${THRESHOLD_TEXT}`}
      />
      <KpiCard
        label="Evidence submission"
        value={formatPercent(metrics.evidenceSubmissionRate)}
        subtext={`${formatNumber(metrics.evidenceSchools)} schools submitted evidence`}
        mom={mom.evidenceSubmissionRate}
        explain={`${explainRisk("Evidence submission rate", metrics.evidenceSubmissionRate)} ${THRESHOLD_TEXT}`}
      />
      <KpiCard
        label="Total enrollment"
        value={formatNumber(metrics.totalEnrollment)}
        subtext={`${formatNumber(metrics.totalAttendance)} total attendance`}
        explain="Sum of enrolled students across filtered schools for the selected month. Attendance subtext shows total attendance counts used for the attendance rate."
      />
      <KpiCard
        label="Attendance rate"
        value={formatPercent(metrics.attendanceRate)}
        mom={mom.attendanceRate}
        explain={`${explainRisk("Attendance rate", metrics.attendanceRate)} ${THRESHOLD_TEXT}`}
      />
    </section>
  );
}
