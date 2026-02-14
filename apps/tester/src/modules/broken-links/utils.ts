import type { CapturedRequest } from "../../types/index.js";
import type {
  BrokenLinksOptions,
  FetchTimingMetrics,
  SingleFetchResult,
} from "./types.js";

export function isAllowedDomain(
  url: string,
  domains: string[] | undefined,
): boolean {
  if (!domains || domains.length === 0) return false;
  try {
    const hostname = new URL(url).hostname;
    return domains.some((d) => hostname === d || hostname.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

export function extractUniqueUrls(
  capturedRequests: CapturedRequest[],
): Map<string, string[]> {
  const urlMap = new Map<string, string[]>();

  for (const req of capturedRequests) {
    const url = req.url;
    if (!url.startsWith("http://") && !url.startsWith("https://")) continue;

    const existing = urlMap.get(url);
    if (existing) {
      if (!existing.includes(req.sourcePageUrl)) {
        existing.push(req.sourcePageUrl);
      }
    } else {
      urlMap.set(url, [req.sourcePageUrl]);
    }
  }

  return urlMap;
}

export function averageMetrics(
  results: SingleFetchResult[],
): FetchTimingMetrics {
  const successful = results.filter((r) => r.error === null);
  if (successful.length === 0) {
    return {
      dnsLookupMs: 0,
      tcpConnectionMs: 0,
      tlsHandshakeMs: 0,
      ttfbMs: 0,
      contentDownloadMs: 0,
      totalTimeMs: 0,
      contentLengthBytes: 0,
    };
  }

  const sum: FetchTimingMetrics = {
    dnsLookupMs: 0,
    tcpConnectionMs: 0,
    tlsHandshakeMs: 0,
    ttfbMs: 0,
    contentDownloadMs: 0,
    totalTimeMs: 0,
    contentLengthBytes: 0,
  };

  for (const r of successful) {
    sum.dnsLookupMs += r.metrics.dnsLookupMs;
    sum.tcpConnectionMs += r.metrics.tcpConnectionMs;
    sum.tlsHandshakeMs += r.metrics.tlsHandshakeMs;
    sum.ttfbMs += r.metrics.ttfbMs;
    sum.contentDownloadMs += r.metrics.contentDownloadMs;
    sum.totalTimeMs += r.metrics.totalTimeMs;
    sum.contentLengthBytes += r.metrics.contentLengthBytes;
  }

  const count = successful.length;
  return {
    dnsLookupMs: Math.round(sum.dnsLookupMs / count),
    tcpConnectionMs: Math.round(sum.tcpConnectionMs / count),
    tlsHandshakeMs: Math.round(sum.tlsHandshakeMs / count),
    ttfbMs: Math.round(sum.ttfbMs / count),
    contentDownloadMs: Math.round(sum.contentDownloadMs / count),
    totalTimeMs: Math.round(sum.totalTimeMs / count),
    contentLengthBytes: Math.round(sum.contentLengthBytes / count),
  };
}

export function determineFetchCount(
  url: string,
  options: BrokenLinksOptions,
): number {
  if (isAllowedDomain(url, options.allowedDomains)) {
    return options.averageFrom;
  }
  return options.averageFromForNotAllowed;
}

export function determineBrokenStatus(
  results: SingleFetchResult[],
): { status: "healthy" | "broken"; reason?: string } {
  if (results.length === 0) {
    return { status: "broken", reason: "No fetch results" };
  }

  let brokenCount = 0;
  let lastReason = "";

  for (const r of results) {
    if (r.error) {
      brokenCount++;
      lastReason = r.error;
    } else if (r.httpStatusCode && r.httpStatusCode >= 400) {
      brokenCount++;
      lastReason = `HTTP ${r.httpStatusCode}`;
    }
  }

  if (brokenCount > results.length / 2) {
    return { status: "broken", reason: lastReason };
  }

  return { status: "healthy" };
}
