import { useCallback } from "react";
import type { ChartFilterRequest } from "@mantra4change/shared-types";
import { fetchChart, type ChartType } from "../api/charts";
import { useAsync } from "./useAsync";

export function useChart(chartType: ChartType, body: ChartFilterRequest) {
  const loader = useCallback(() => fetchChart(chartType, body), [
    chartType,
    body.month,
    body.district,
    body.block,
    body.grade,
    body.subject,
    body.grantId,
  ]);
  return useAsync(loader, [
    chartType,
    body.month,
    body.district,
    body.block,
    body.grade,
    body.subject,
    body.grantId,
  ]);
}
