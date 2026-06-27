import type { GrantEvidenceFact } from "@mantra4change/shared-types";
import { EmptyState } from "../ui/StatePanels";
import { API_BASE } from "../../api/http";

export function EvidenceGallery({ evidence }: { evidence: GrantEvidenceFact[] }) {
  if (evidence.length === 0) {
    return (
      <EmptyState
        title="No linked evidence"
        description="No evidence or media records are indexed for this grant and reporting month."
      />
    );
  }

  return (
    <section className="card evidence-gallery">
      <div className="section-header">
        <h3>Evidence gallery</h3>
        <p className="muted">{evidence.length} linked record(s)</p>
      </div>
      <div className="evidence-grid">
        {evidence.map((item) => (
          <article key={item.recordId} className="evidence-card">
            <div className="evidence-image-wrap">
              <img
                src={
                  item.imageUrl.startsWith("http")
                    ? item.imageUrl
                    : `${API_BASE.replace(/\/$/, "")}${item.imageUrl}`
                }
                alt={item.title}
                loading="lazy"
              />
            </div>
            <div className="evidence-body">
              <p className="evidence-id">{item.recordId}</p>
              <h4>{item.title}</h4>
              <p className="muted">{item.summaryOrCaption}</p>
              <p className="evidence-meta">
                {item.recordType} · {item.district} · {item.reportingMonth}
              </p>
              <p className="evidence-note">{item.usageNote}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
