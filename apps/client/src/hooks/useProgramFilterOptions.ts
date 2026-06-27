import { useCallback } from "react";
import { fetchProgramFilters } from "../api/program";
import { useAsync } from "./useAsync";

export function useProgramFilterOptions() {
  const loader = useCallback(() => fetchProgramFilters(), []);
  return useAsync(loader, []);
}
