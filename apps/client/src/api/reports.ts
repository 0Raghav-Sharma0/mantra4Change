import type { AiNarrativeResponse, GrantNarrativeRequest, ProgramNarrativeRequest } from "@mantra4change/shared-types";
import { apiPost } from "./http";

export function fetchProgramReport(body: ProgramNarrativeRequest): Promise<AiNarrativeResponse> {
  return apiPost<AiNarrativeResponse>("/api/reports/program", body);
}

export function fetchGrantReport(body: GrantNarrativeRequest): Promise<AiNarrativeResponse> {
  return apiPost<AiNarrativeResponse>("/api/reports/grant", body);
}
