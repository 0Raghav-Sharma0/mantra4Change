import { useEffect, useMemo, useState } from "react";
import type { ReportingMonth } from "@mantra4change/shared-types";
import { getLatestReportingMonth } from "@mantra4change/shared-types";
import { EvidenceGallery } from "../components/grants/EvidenceGallery";
import { GrantFactPanel } from "../components/grants/GrantFactPanel";
import { GrantSelectors } from "../components/grants/GrantSelectors";
import { NarrativePanel } from "../components/narrative/NarrativePanel";
import { ErrorState, LoadingState } from "../components/ui/StatePanels";
import { useGrantFacts } from "../hooks/useGrantFacts";
import { useGrantList } from "../hooks/useGrantList";
import { useGrantNarrative } from "../hooks/useGrantNarrative";
import { useSummaryPreferences } from "../context/SummaryContext";

export default function GrantsPage() {
  const { useEnhancedSummaries } = useSummaryPreferences();
  const grantList = useGrantList();
  const [grantId, setGrantId] = useState("");
  const [month, setMonth] = useState<ReportingMonth | "">("");

  const selectedGrant = useMemo(
    () => grantList.data?.grants.find((grant) => grant.grantId === grantId),
    [grantList.data, grantId],
  );

  useEffect(() => {
    if (!grantId && grantList.data?.grants[0]) {
      setGrantId(grantList.data.grants[0].grantId);
    }
  }, [grantList.data, grantId]);

  useEffect(() => {
    if (selectedGrant && !month) {
      const latest =
        selectedGrant.reportingMonths[selectedGrant.reportingMonths.length - 1] ??
        getLatestReportingMonth();
      setMonth(latest);
    }
  }, [selectedGrant, month]);

  useEffect(() => {
    if (selectedGrant && month && !selectedGrant.reportingMonths.includes(month)) {
      const latest =
        selectedGrant.reportingMonths[selectedGrant.reportingMonths.length - 1] ??
        getLatestReportingMonth();
      setMonth(latest);
    }
  }, [selectedGrant, month]);

  const facts = useGrantFacts(grantId || null, month || null);
  const narrative = useGrantNarrative(grantId || null, month || null);

  return (
    <div className="page grants-page">
      <header className="page-header">
        <h2>Grant Reporting</h2>
        <p className="muted">
          Grant performance, finance, milestones, and evidence. Turn on smart summaries in the
          header for a written report draft.
        </p>
      </header>

      {grantList.loading && <LoadingState label="Loading grants…" />}
      {grantList.error && <ErrorState message={grantList.error} onRetry={grantList.reload} />}

      {grantList.data && (
        <GrantSelectors
          grants={grantList.data.grants}
          grantId={grantId}
          month={month}
          onGrantChange={(value) => {
            setGrantId(value);
            setMonth("");
          }}
          onMonthChange={setMonth}
        />
      )}

      {!grantId || !month ? (
        <section className="card">
          <p className="muted">Select a grant and reporting month to load facts and report preview.</p>
        </section>
      ) : (
        <>
          {facts.loading && <LoadingState label="Loading grant facts…" />}
          {facts.error && <ErrorState message={facts.error} onRetry={facts.reload} />}
          {facts.data && <GrantFactPanel facts={facts.data} />}

          {facts.data && <EvidenceGallery evidence={facts.data.evidence} />}

          {narrative.loading && (
            <LoadingState
              label={useEnhancedSummaries ? "Writing summary…" : "Loading grant report…"}
            />
          )}
          {narrative.error && <ErrorState message={narrative.error} onRetry={narrative.reload} />}
          {narrative.data && (
            <NarrativePanel
              title="Grant report"
              narrative={narrative.data}
              grantId={grantId}
              grantName={selectedGrant?.grantName ?? facts.data?.grantName}
              reportingMonth={month}
            />
          )}
        </>
      )}
    </div>
  );
}
