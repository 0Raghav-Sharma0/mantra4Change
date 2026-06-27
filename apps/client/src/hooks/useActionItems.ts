import { useCallback, useState } from "react";
import type { ActionStatus } from "@mantra4change/shared-types";
import { fetchActionItems, regenerateActionItems, updateActionItem } from "../api/review";
import { useFilters } from "../context/FilterContext";
import { useAsync } from "./useAsync";

export function useActionItems() {
  const { queryFilters } = useFilters();
  const [refreshKey, setRefreshKey] = useState(0);

  const loader = useCallback(
    () => fetchActionItems(queryFilters),
    [queryFilters, refreshKey],
  );

  const state = useAsync(loader, [queryFilters, refreshKey], true);

  const regenerate = useCallback(async () => {
    const payload = await regenerateActionItems(queryFilters);
    setRefreshKey((value) => value + 1);
    return payload;
  }, [queryFilters]);

  const setStatus = useCallback(async (id: string, status: ActionStatus) => {
    await updateActionItem(id, { status });
    setRefreshKey((value) => value + 1);
  }, []);

  return { ...state, regenerate, setStatus };
}
