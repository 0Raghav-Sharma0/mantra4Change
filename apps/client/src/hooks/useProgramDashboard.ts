import { useCallback } from "react";
import type { ProgramQueryFilters } from "../api/program";
import { fetchProgramDashboard } from "../api/program";
import { useAsync } from "./useAsync";

export function useProgramDashboard(filters: ProgramQueryFilters) {
  const loader = useCallback(() => fetchProgramDashboard(filters), [
    filters.month,
    filters.district,
    filters.block,
    filters.grade,
    filters.subject,
  ]);
  return useAsync(loader, [
    filters.month,
    filters.district,
    filters.block,
    filters.grade,
    filters.subject,
  ]);
}
