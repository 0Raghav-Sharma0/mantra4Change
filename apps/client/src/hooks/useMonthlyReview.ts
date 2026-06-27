import { useCallback } from "react";
import { fetchMonthlyReview } from "../api/review";
import { useFilters } from "../context/FilterContext";
import { useAsync } from "./useAsync";

export function useMonthlyReview() {
  const { queryFilters } = useFilters();

  const loader = useCallback(() => fetchMonthlyReview(queryFilters), [queryFilters]);
  return useAsync(loader, [queryFilters], true);
}
