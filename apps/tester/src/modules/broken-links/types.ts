export interface BrokenLinksOptions {
  averageFrom: number;
  allowedDomains: string[];
  averageFromForNotAllowed: number;
}

export interface FetchTimingMetrics {
  dnsLookupMs: number;
  tcpConnectionMs: number;
  tlsHandshakeMs: number;
  ttfbMs: number;
  contentDownloadMs: number;
  totalTimeMs: number;
  contentLengthBytes: number;
}

export interface SingleFetchResult {
  httpStatusCode: number | null;
  error: string | null;
  metrics: FetchTimingMetrics;
  redirectChain: string[];
}

export interface BrokenLinkResult {
  url: string;
  sourcePageUrls: string[];
  status: "healthy" | "broken" | "skipped";
  brokenReason?: string;
  httpStatusCode?: number;
  redirectChain: string[];
  metrics: FetchTimingMetrics;
  fetchCount: number;
}

export interface BrokenLinksSummary {
  totalUrls: number;
  brokenCount: number;
  healthyCount: number;
  skippedCount: number;
  durationMs: number;
}

export interface CheckLinksResult {
  results: BrokenLinkResult[];
  summary: BrokenLinksSummary;
}
