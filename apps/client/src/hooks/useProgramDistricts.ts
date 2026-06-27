import { useCallback } from "react";
import type { ProgramQueryFilters } from "../api/program";
import { fetchProgramDistricts } from "../api/program";
import { useAsync } from "./useAsync";

export function useProgramDistricts(filters: ProgramQueryFilters) {
  const loader = useCallback(() => fetchProgramDistricts(filters), [
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
