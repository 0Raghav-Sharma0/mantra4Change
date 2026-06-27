import type { ActionItem, ActionStatus } from "@mantra4change/shared-types";

const STATUS_LABELS: Record<ActionStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  done: "Done",
};

interface ActionItemsPanelProps {
  items: ActionItem[];
  loading?: boolean;
  onRegenerate?: () => void;
  onStatusChange?: (id: string, status: ActionStatus) => void;
}

export function ActionItemsPanel({
  items,
  loading,
  onRegenerate,
  onStatusChange,
}: ActionItemsPanelProps) {
  return (
    <section className="card action-items-panel">
      <div className="section-header">
        <div>
          <h3>Recommended actions</h3>
          <p className="muted">Suggested follow-ups linked to districts, blocks, and indicators.</p>
        </div>
        {onRegenerate && (
          <button type="button" className="btn-secondary" onClick={onRegenerate} disabled={loading}>
            Refresh actions
          </button>
        )}
      </div>

      <div className="action-items-list">
        {items.map((item) => (
          <article key={item.id} className={`action-item priority-${item.priority}`}>
            <div className="action-item-main">
              <div className="action-item-title-row">
                <h4>{item.title}</h4>
                <span className={`priority-pill priority-${item.priority}`}>{item.priority}</span>
              </div>
              <p className="muted">{item.description}</p>
              <div className="action-item-meta">
                <span>
                  <strong>Owner:</strong> {item.owner}
                </span>
                <span>
                  <strong>Due:</strong> {item.dueDate}
                </span>
                <span>
                  <strong>Metric:</strong> {item.linkedMetric}
                </span>
                {item.district && (
                  <span>
                    <strong>District:</strong> {item.district}
                  </span>
                )}
                {item.block && (
                  <span>
                    <strong>Block:</strong> {item.block}
                  </span>
                )}
              </div>
            </div>
            {onStatusChange && (
              <label className="action-status-select">
                Status
                <select
                  value={item.status}
                  onChange={(event) =>
                    onStatusChange(item.id, event.target.value as ActionStatus)
                  }
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
