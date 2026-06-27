import { useCallback } from "react";
import type { ReportingMonth } from "@mantra4change/shared-types";
import { fetchGrantReport } from "../api/grants";
import { useAsync } from "./useAsync";

export function useGrantReport(grantId: string | null, month: ReportingMonth | null) {
  const loader = useCallback(async () => {
    if (!grantId || !month) return null;
    return fetchGrantReport(grantId, month);
  }, [grantId, month]);

  return useAsync(loader, [grantId, month], Boolean(grantId && month));
}
