import { useSummaryPreferences } from "../../context/SummaryContext";

export function SummaryToggle() {
  const { smartSummaries, setSmartSummaries, serverReady } = useSummaryPreferences();

  return (
    <label
      className="header-toggle"
      title={
        serverReady
          ? "Generate written summaries from computed metrics"
          : "Set GEMINI_API_KEY or AI_API_KEY in server .env to enable"
      }
    >
      <span className="header-toggle-label">Smart summaries</span>
      <span className="switch">
        <input
          type="checkbox"
          checked={smartSummaries && serverReady}
          onChange={(event) => setSmartSummaries(event.target.checked)}
          disabled={!serverReady}
        />
        <span className="switch-track" aria-hidden="true" />
      </span>
    </label>
  );
}
