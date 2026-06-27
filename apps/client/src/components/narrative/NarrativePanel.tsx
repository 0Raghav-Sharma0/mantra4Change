import { useState } from "react";
import type { AiNarrativeResponse } from "@mantra4change/shared-types";
import { buildGrantReportMarkdown, downloadTextFile } from "../../utils/export";

interface NarrativePanelProps {
  narrative: AiNarrativeResponse;
  title?: string;
  grantId?: string;
  grantName?: string;
  reportingMonth?: string;
  nested?: boolean;
}

export function NarrativePanel({
  narrative,
  title = "Report summary",
  grantId,
  grantName,
  reportingMonth,
  nested = false,
}: NarrativePanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(narrative.narrative);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleDownloadMarkdown = () => {
    if (!grantId || !grantName || !reportingMonth) return;
    const markdown = buildGrantReportMarkdown({
      grantId,
      grantName,
      reportingMonth,
      narrative,
    });
    downloadTextFile(markdown, `${grantId}-${reportingMonth}-report.md`);
  };

  return (
    <section className={`narrative-panel${nested ? "" : " card"}`}>
      <div className="section-header narrative-header">
        <h3>{title}</h3>
        <div className="narrative-actions">
          <button type="button" className="btn-secondary" onClick={handleCopy}>
            {copied ? "Copied" : "Copy text"}
          </button>
          {grantId && grantName && reportingMonth && (
            <button type="button" className="btn-secondary" onClick={handleDownloadMarkdown}>
              Download .md
            </button>
          )}
        </div>
      </div>
      <div className="report-text">{narrative.narrative}</div>
    </section>
  );
}
