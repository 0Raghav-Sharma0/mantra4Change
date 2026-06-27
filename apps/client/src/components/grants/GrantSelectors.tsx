import type { GrantListItem, ReportingMonth } from "@mantra4change/shared-types";
import { formatMonthLabel } from "../../utils/format";

interface GrantSelectorsProps {
  grants: GrantListItem[];
  grantId: string;
  month: ReportingMonth | "";
  onGrantChange: (grantId: string) => void;
  onMonthChange: (month: ReportingMonth) => void;
}

export function GrantSelectors({
  grants,
  grantId,
  month,
  onGrantChange,
  onMonthChange,
}: GrantSelectorsProps) {
  const selectedGrant = grants.find((grant) => grant.grantId === grantId);
  const monthOptions = selectedGrant?.reportingMonths ?? [];

  return (
    <section className="card grant-selectors">
      <h3>Select grant report</h3>
      <div className="filter-grid">
        <label>
          Grant
          <select value={grantId} onChange={(e) => onGrantChange(e.target.value)}>
            <option value="">Select grant…</option>
            {grants.map((grant) => (
              <option key={grant.grantId} value={grant.grantId}>
                {grant.grantName} ({grant.grantId})
              </option>
            ))}
          </select>
        </label>
        <label>
          Reporting month
          <select
            value={month}
            onChange={(e) => onMonthChange(e.target.value as ReportingMonth)}
            disabled={!grantId}
          >
            <option value="">Select month…</option>
            {monthOptions.map((option) => (
              <option key={option} value={option}>
                {formatMonthLabel(option)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {selectedGrant && (
        <p className="muted grant-meta">
          Donor: {selectedGrant.donor} · Districts: {selectedGrant.coveredDistricts.join("; ")}
        </p>
      )}
    </section>
  );
}
