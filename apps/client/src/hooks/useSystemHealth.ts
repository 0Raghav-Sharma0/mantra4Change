import { useCallback } from "react";
import { fetchFullHealth } from "../api/health";
import { useAsync } from "./useAsync";

export function useSystemHealth() {
  const loader = useCallback(() => fetchFullHealth(), []);
  return useAsync(loader, [], true);
}
