import { getLatestReportingMonth, type ReportingMonth } from "@mantra4change/shared-types";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export interface ProgramFiltersState {
  month: ReportingMonth;
  district: string;
  block: string;
  grade: string;
  subject: string;
}

interface FilterContextValue {
  filters: ProgramFiltersState;
  setFilter: <K extends keyof ProgramFiltersState>(key: K, value: ProgramFiltersState[K]) => void;
  resetFilters: () => void;
  queryFilters: {
    month: ReportingMonth;
    district?: string;
    block?: string;
    grade?: string;
    subject?: string;
  };
}

const defaultFilters: ProgramFiltersState = {
  month: getLatestReportingMonth(),
  district: "",
  block: "",
  grade: "",
  subject: "",
};

const FilterContext = createContext<FilterContextValue | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<ProgramFiltersState>(defaultFilters);

  const value = useMemo<FilterContextValue>(() => {
    const setFilter = <K extends keyof ProgramFiltersState>(
      key: K,
      val: ProgramFiltersState[K],
    ) => {
      setFilters((prev) => {
        const next = { ...prev, [key]: val };
        if (key === "district" && val !== prev.district) {
          next.block = "";
        }
        return next;
      });
    };

    return {
      filters,
      setFilter,
      resetFilters: () => setFilters(defaultFilters),
      queryFilters: {
        month: filters.month,
        district: filters.district || undefined,
        block: filters.block || undefined,
        grade: filters.grade || undefined,
        subject: filters.subject || undefined,
      },
    };
  }, [filters]);

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters(): FilterContextValue {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilters must be used within FilterProvider");
  return ctx;
}
