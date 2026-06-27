import type { CitedFact } from "./grants.js";

export interface NarrativeValidationReport {
  passed: boolean;
  errors: string[];
  rejectedNumbers: string[];
  rejectedIdentifiers: string[];
}

export interface AiNarrativeResponse {
  narrative: string;
  citedFacts: CitedFact[];
  generatedBy: "ai" | "deterministic";
  validationReport: NarrativeValidationReport;
  contextHash: string;
  promptHash: string;
}

export interface ProgramNarrativeRequest {
  month?: string;
  district?: string;
  block?: string;
  grade?: string;
  subject?: string;
  aiRequested?: boolean;
}

export interface GrantNarrativeRequest {
  grantId: string;
  month: string;
  aiRequested?: boolean;
}
