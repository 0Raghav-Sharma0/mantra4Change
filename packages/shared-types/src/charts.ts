export interface ChartFilterRequest {
  month?: string;
  reportingMonth?: string;
  district?: string;
  block?: string;
  grade?: string;
  subject?: string;
  grantId?: string;
  exportPng?: boolean;
}

export interface ChartResponse {
  chartType: string;
  filters: Record<string, string | null | undefined>;
  isEmpty: boolean;
  plotlyFigure: Record<string, unknown>;
  pngPath: string | null;
  summary: Record<string, unknown>;
  cached?: boolean;
}
