import { useCallback } from "react";
import type { ReportingMonth } from "@mantra4change/shared-types";
import { fetchGrantReport } from "../api/reports";
import { useSummaryPreferences } from "../context/SummaryContext";
import { useAsync } from "./useAsync";

export function useGrantNarrative(grantId: string | null, month: ReportingMonth | null) {
  const { useEnhancedSummaries } = useSummaryPreferences();

  const loader = useCallback(async () => {
    if (!grantId || !month) return null;
    return fetchGrantReport({ grantId, month, aiRequested: useEnhancedSummaries });
  }, [grantId, month, useEnhancedSummaries]);

  return useAsync(loader, [grantId, month, useEnhancedSummaries], Boolean(grantId && month));
}
