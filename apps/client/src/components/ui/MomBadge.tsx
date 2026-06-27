import { formatMomDelta } from "../../utils/format";

export function MomBadge({ delta }: { delta: number | undefined }) {
  const label = formatMomDelta(delta);
  if (!label) return <span className="mom-badge mom-neutral">No prior month</span>;

  const direction = delta !== undefined && delta > 0 ? "up" : delta !== undefined && delta < 0 ? "down" : "flat";
  return <span className={`mom-badge mom-${direction}`}>MoM {label}</span>;
}
