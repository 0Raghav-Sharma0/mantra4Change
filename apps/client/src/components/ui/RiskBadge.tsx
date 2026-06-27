import type { RiskStatus } from "@mantra4change/shared-types";
import { riskClassName } from "../../utils/format";

export function RiskBadge({ status }: { status: RiskStatus }) {
  return <span className={`risk-badge ${riskClassName(status)}`}>{status}</span>;
}
