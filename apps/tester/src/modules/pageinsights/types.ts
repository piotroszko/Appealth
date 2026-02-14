export type Category = "performance" | "accessibility" | "best-practices" | "seo";

export interface PageInsightsRequestBody {
  url: string;
  strategy?: "desktop" | "mobile";
  categories?: Category[];
}

export interface PageInsightsResult {
  url: string;
  timestamp: string;
  analysisUTCTimestamp: string;
  lighthouseResult: Record<string, unknown>;
  loadingExperience: Record<string, unknown>;
}
