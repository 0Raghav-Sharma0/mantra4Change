import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useSystemHealth } from "../hooks/useSystemHealth";

const STORAGE_KEY = "mantra4change.smartSummaries";

interface SummaryContextValue {
  /** User preference: request enhanced prose when the server supports it. */
  smartSummaries: boolean;
  setSmartSummaries: (enabled: boolean) => void;
  /** Server has an API key configured and narratives are enabled. */
  serverReady: boolean;
  /** Whether report requests should ask for enhanced summaries. */
  useEnhancedSummaries: boolean;
}

const SummaryContext = createContext<SummaryContextValue | null>(null);

function readStoredPreference(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "false";
  } catch {
    return true;
  }
}

export function SummaryProvider({ children }: { children: ReactNode }) {
  const { data: health } = useSystemHealth();
  const serverReady = health?.dependencies?.ai === "enabled";
  const [smartSummaries, setSmartSummariesState] = useState(readStoredPreference);

  const setSmartSummaries = (enabled: boolean) => {
    setSmartSummariesState(enabled);
    try {
      localStorage.setItem(STORAGE_KEY, enabled ? "true" : "false");
    } catch {
      // ignore storage failures
    }
  };

  const value = useMemo<SummaryContextValue>(
    () => ({
      smartSummaries,
      setSmartSummaries,
      serverReady,
      useEnhancedSummaries: smartSummaries && serverReady,
    }),
    [smartSummaries, serverReady],
  );

  return <SummaryContext.Provider value={value}>{children}</SummaryContext.Provider>;
}

export function useSummaryPreferences(): SummaryContextValue {
  const ctx = useContext(SummaryContext);
  if (!ctx) throw new Error("useSummaryPreferences must be used within SummaryProvider");
  return ctx;
}
