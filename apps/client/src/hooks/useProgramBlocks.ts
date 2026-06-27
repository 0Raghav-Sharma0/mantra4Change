import { useCallback } from "react";
import type { ProgramQueryFilters } from "../api/program";
import { fetchProgramBlocks } from "../api/program";
import { useAsync } from "./useAsync";

export function useProgramBlocks(filters: ProgramQueryFilters) {
  const loader = useCallback(() => fetchProgramBlocks(filters), [
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
