export interface CoverageOptions {
  waitUntil: "load" | "domcontentloaded" | "networkidle";
  timeoutMs: number;
  includeThirdParty: boolean;
}

export interface FileCoverageResult {
  url: string;
  type: "js" | "css";
  totalBytes: number;
  usedBytes: number;
  unusedBytes: number;
  usagePercent: number;
  isThirdParty: boolean;
}

export interface CoverageSummary {
  totalJsFiles: number;
  totalCssFiles: number;
  totalJsBytes: number;
  usedJsBytes: number;
  unusedJsBytes: number;
  jsUsagePercent: number;
  totalCssBytes: number;
  usedCssBytes: number;
  unusedCssBytes: number;
  cssUsagePercent: number;
  overallUsagePercent: number;
  durationMs: number;
}

export interface CollectCoverageResult {
  results: FileCoverageResult[];
  summary: CoverageSummary;
}
