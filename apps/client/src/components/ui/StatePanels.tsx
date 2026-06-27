import type { ReactNode } from "react";

export function LoadingState({
  label = "Loading…",
  inline = false,
}: {
  label?: string;
  inline?: boolean;
}) {
  return (
    <div
      className={`state-panel state-loading${inline ? " state-panel--inline" : ""}`}
      role="status"
      aria-live="polite"
    >
      <span className="spinner" aria-hidden />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  inline = false,
}: {
  message: string;
  onRetry?: () => void;
  inline?: boolean;
}) {
  return (
    <div
      className={`state-panel state-error${inline ? " state-panel--inline" : ""}`}
      role="alert"
    >
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="btn-secondary" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  inline = false,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  inline?: boolean;
}) {
  return (
    <div className={`state-panel state-empty${inline ? " state-panel--inline" : ""}`}>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
