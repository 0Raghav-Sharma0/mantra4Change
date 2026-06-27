export type { SchoolRecord, ResolvedProgramFilters } from "./filters.js";
export {
  buildMongoBaseFilter,
  extractFilterOptions,
  filterSchoolRecords,
  matchesGrade,
  matchesSubject,
  parseProgramFilters,
} from "./filters.js";
export {
  aggregateAttendance,
  aggregateEvidence,
  aggregateParticipation,
  computeScopedSchoolMetrics,
} from "./metrics.js";
export {
  buildDashboardMetrics,
  buildOverallRiskIndicators,
  buildRiskIndicator,
  compositeRate,
  worstRiskStatus,
} from "./riskEngine.js";
export {
  buildGeographyPerformances,
  buildGeographyResponse,
  buildProgramRisks,
  buildReviewSummary,
  splitPerformers,
} from "./geography.js";
