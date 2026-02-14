import type { pagespeedonline_v5 } from "googleapis";

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
  lighthouseResult: pagespeedonline_v5.Schema$LighthouseResultV5;
  loadingExperience: pagespeedonline_v5.Schema$PagespeedApiLoadingExperienceV5;
}
