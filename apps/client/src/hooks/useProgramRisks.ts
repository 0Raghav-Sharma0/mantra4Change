import { useCallback } from "react";
import type { ProgramQueryFilters } from "../api/program";
import { fetchProgramRisks } from "../api/program";
import { useAsync } from "./useAsync";

export function useProgramRisks(filters: ProgramQueryFilters) {
  const loader = useCallback(() => fetchProgramRisks(filters), [
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
