import { useCallback } from "react";
import { fetchGrantList } from "../api/grants";
import { useAsync } from "./useAsync";

export function useGrantList() {
  const loader = useCallback(() => fetchGrantList(), []);
  return useAsync(loader, []);
}
