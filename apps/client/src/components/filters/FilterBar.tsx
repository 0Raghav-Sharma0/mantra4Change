import { useMemo } from "react";
import { useFilters } from "../../context/FilterContext";
import { useProgramFilterOptions } from "../../hooks/useProgramFilterOptions";
import { formatMonthLabel } from "../../utils/format";
import { ErrorState, LoadingState } from "../ui/StatePanels";

export function FilterBar() {
  const { filters, setFilter, resetFilters } = useFilters();
  const { data, loading, error, reload } = useProgramFilterOptions();

  const blockOptions = useMemo(() => {
    if (!data) return [];
    if (!filters.district) return data.blocks;
    return data.blocks.filter((block) => block.startsWith(filters.district));
  }, [data, filters.district]);

  if (loading) {
    return (
      <section className="filter-bar card filter-bar-compact">
        <LoadingState label="Loading filters…" inline />
      </section>
    );
  }
  if (error || !data) {
    return (
      <section className="filter-bar card filter-bar-compact">
        <ErrorState message={error ?? "Could not load filters"} onRetry={reload} inline />
      </section>
    );
  }

  return (
    <section className="filter-bar card filter-bar-compact">
      <div className="filter-grid">
        <label>
          <span className="filter-label">Month</span>
          <select
            value={filters.month}
            onChange={(e) => setFilter("month", e.target.value as typeof filters.month)}
          >
            {data.reportingMonths.map((month) => (
              <option key={month} value={month}>
                {formatMonthLabel(month)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="filter-label">District</span>
          <select
            value={filters.district}
            onChange={(e) => setFilter("district", e.target.value)}
          >
            <option value="">All districts</option>
            {data.districts.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="filter-label">Block</span>
          <select
            value={filters.block}
            onChange={(e) => setFilter("block", e.target.value)}
            disabled={blockOptions.length === 0}
          >
            <option value="">All blocks</option>
            {blockOptions.map((block) => (
              <option key={block} value={block}>
                {block}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="filter-label">Grade</span>
          <select value={filters.grade} onChange={(e) => setFilter("grade", e.target.value)}>
            <option value="">All grades</option>
            {data.grades.map((grade) => (
              <option key={grade} value={grade}>
                Class {grade}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="filter-label">Subject</span>
          <select value={filters.subject} onChange={(e) => setFilter("subject", e.target.value)}>
            <option value="">All subjects</option>
            {data.subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </label>
        <div className="filter-actions">
          <button type="button" className="btn-text" onClick={resetFilters}>
            Reset
          </button>
        </div>
      </div>
    </section>
  );
}
