import { useCallback } from "react";
import { fetchProgramReport } from "../api/reports";
import { useSummaryPreferences } from "../context/SummaryContext";
import { useFilters } from "../context/FilterContext";
import { useAsync } from "./useAsync";

export function useProgramNarrative() {
  const { queryFilters } = useFilters();
  const { useEnhancedSummaries } = useSummaryPreferences();

  const loader = useCallback(async () => {
    return fetchProgramReport({
      month: queryFilters.month,
      district: queryFilters.district,
      block: queryFilters.block,
      grade: queryFilters.grade,
      subject: queryFilters.subject,
      aiRequested: useEnhancedSummaries,
    });
  }, [queryFilters, useEnhancedSummaries]);

  return useAsync(loader, [queryFilters, useEnhancedSummaries], true);
}
