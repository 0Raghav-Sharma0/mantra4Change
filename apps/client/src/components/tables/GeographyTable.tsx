import type { GeographyPerformance } from "@mantra4change/shared-types";
import { formatNumber, formatPercent } from "../../utils/format";
import { RiskBadge } from "../ui/RiskBadge";
import { EmptyState } from "../ui/StatePanels";

interface GeographyTableProps {
  title: string;
  rows: GeographyPerformance[];
  showDistrict?: boolean;
}

export function GeographyTable({ title, rows, showDistrict = false }: GeographyTableProps) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title={`No ${title.toLowerCase()} data`}
        description="Try adjusting filters to see performance rows."
      />
    );
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            {showDistrict && <th>District</th>}
            <th>Schools</th>
            <th>Participation</th>
            <th>Evidence</th>
            <th>Attendance</th>
            <th>Composite</th>
            <th>Risk</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.level}-${row.name}`}>
              <td>{row.name}</td>
              {showDistrict && <td>{row.district ?? "—"}</td>}
              <td>{formatNumber(row.schoolCount)}</td>
              <td>{formatPercent(row.participationRate)}</td>
              <td>{formatPercent(row.evidenceSubmissionRate)}</td>
              <td>{formatPercent(row.attendanceRate)}</td>
              <td>{formatPercent(row.compositeScore)}</td>
              <td>
                <RiskBadge status={row.riskStatus} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
