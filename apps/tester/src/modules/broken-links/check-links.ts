import http from "node:http";
import https from "node:https";
import type { CapturedRequest } from "../../types/index.js";
import type {
  BrokenLinksOptions,
  BrokenLinkResult,
  BrokenLinksSummary,
  CheckLinksResult,
  FetchTimingMetrics,
  SingleFetchResult,
} from "./types.js";
import {
  extractUniqueUrls,
  determineFetchCount,
  determineBrokenStatus,
  averageMetrics,
} from "./utils.js";

const MAX_REDIRECTS = 20;
const DEFAULT_TIMEOUT_MS = 10_000;
const DELAY_BETWEEN_URLS_MS = 50;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithMetrics(
  url: string,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<SingleFetchResult> {
  const redirectChain: string[] = [];
  let currentUrl = url;

  const startTime = performance.now();
  let dnsLookupMs = 0;
  let tcpConnectionMs = 0;
  let tlsHandshakeMs = 0;

  for (let hop = 0; hop < MAX_REDIRECTS; hop++) {
    let parsed: URL;
    try {
      parsed = new URL(currentUrl);
    } catch {
      return {
        httpStatusCode: null,
        error: `Invalid URL: ${currentUrl}`,
        metrics: emptyMetrics(),
        redirectChain,
      };
    }

    const isHttps = parsed.protocol === "https:";
    const transport = isHttps ? https : http;
    const agent = new (isHttps ? https.Agent : http.Agent)({ keepAlive: false });

    const result = await new Promise<{
      statusCode: number;
      headers: http.IncomingHttpHeaders;
      contentLength: number;
      hopDns: number;
      hopTcp: number;
      hopTls: number;
      hopTtfb: number;
      hopDownload: number;
    } | { error: string }>((resolve) => {
      const hopStart = performance.now();
      let hopDns = 0;
      let hopTcp = 0;
      let hopTls = 0;
      let responseStart = 0;

      const req = transport.request(
        currentUrl,
        {
          method: "GET",
          agent,
          timeout: timeoutMs,
          headers: {
            "User-Agent": "FullTester-BrokenLinkChecker/1.0",
            Accept: "*/*",
          },
        },
        (res) => {
          responseStart = performance.now();
          let contentLength = 0;

          res.on("data", (chunk: Buffer) => {
            contentLength += chunk.length;
          });

          res.on("end", () => {
            const hopEnd = performance.now();
            resolve({
              statusCode: res.statusCode!,
              headers: res.headers,
              contentLength,
              hopDns,
              hopTcp,
              hopTls,
              hopTtfb: responseStart - hopStart,
              hopDownload: hopEnd - responseStart,
            });
          });

          res.on("error", (err) => {
            resolve({ error: err.message });
          });
        },
      );

      req.on("socket", (socket) => {
        const socketStart = performance.now();

        socket.on("lookup", () => {
          hopDns = performance.now() - socketStart;
        });

        socket.on("connect", () => {
          hopTcp = performance.now() - socketStart - hopDns;
        });

        socket.on("secureConnect", () => {
          hopTls = performance.now() - socketStart - hopDns - hopTcp;
        });
      });

      req.on("timeout", () => {
        req.destroy();
        resolve({ error: "Timeout" });
      });

      req.on("error", (err) => {
        resolve({ error: err.message });
      });

      req.end();
    });

    if ("error" in result) {
      return {
        httpStatusCode: null,
        error: result.error,
        metrics: emptyMetrics(),
        redirectChain,
      };
    }

    dnsLookupMs += result.hopDns;
    tcpConnectionMs += result.hopTcp;
    tlsHandshakeMs += result.hopTls;

    const statusCode = result.statusCode;
    if (statusCode >= 300 && statusCode < 400 && result.headers.location) {
      redirectChain.push(currentUrl);
      const location = result.headers.location;
      currentUrl = location.startsWith("http")
        ? location
        : new URL(location, currentUrl).href;
      continue;
    }

    const totalTime = performance.now() - startTime;

    const metrics: FetchTimingMetrics = {
      dnsLookupMs: Math.round(dnsLookupMs),
      tcpConnectionMs: Math.round(tcpConnectionMs),
      tlsHandshakeMs: Math.round(tlsHandshakeMs),
      ttfbMs: Math.round(result.hopTtfb),
      contentDownloadMs: Math.round(result.hopDownload),
      totalTimeMs: Math.round(totalTime),
      contentLengthBytes: result.contentLength,
    };

    return {
      httpStatusCode: statusCode,
      error: null,
      metrics,
      redirectChain,
    };
  }

  return {
    httpStatusCode: null,
    error: "Too many redirects",
    metrics: emptyMetrics(),
    redirectChain,
  };
}

export async function checkLinks(
  capturedRequests: CapturedRequest[],
  options: BrokenLinksOptions,
): Promise<CheckLinksResult> {
  const startTime = performance.now();
  const urlMap = extractUniqueUrls(capturedRequests);
  const results: BrokenLinkResult[] = [];

  let brokenCount = 0;
  let healthyCount = 0;
  let skippedCount = 0;

  let isFirst = true;
  for (const [url, sourcePageUrls] of urlMap) {
    if (!isFirst) await delay(DELAY_BETWEEN_URLS_MS);
    isFirst = false;

    const fetchCount = determineFetchCount(url, options);

    if (fetchCount <= 0) {
      results.push({
        url,
        sourcePageUrls,
        status: "skipped",
        redirectChain: [],
        metrics: emptyMetrics(),
        fetchCount: 0,
      });
      skippedCount++;
      continue;
    }

    const fetchResults: SingleFetchResult[] = [];
    for (let i = 0; i < fetchCount; i++) {
      const result = await fetchWithMetrics(url);
      fetchResults.push(result);
    }

    const avgMetrics = averageMetrics(fetchResults);
    const { status, reason } = determineBrokenStatus(fetchResults);
    const lastSuccessful = fetchResults.findLast((r) => r.httpStatusCode !== null);

    const linkResult: BrokenLinkResult = {
      url,
      sourcePageUrls,
      status,
      redirectChain: lastSuccessful?.redirectChain ?? fetchResults[0]!.redirectChain,
      metrics: avgMetrics,
      fetchCount,
    };

    if (status === "broken" && reason) {
      linkResult.brokenReason = reason;
    }

    if (lastSuccessful?.httpStatusCode) {
      linkResult.httpStatusCode = lastSuccessful.httpStatusCode;
    }

    if (status === "broken") brokenCount++;
    else healthyCount++;

    results.push(linkResult);
  }

  const durationMs = Math.round(performance.now() - startTime);
  const summary: BrokenLinksSummary = {
    totalUrls: urlMap.size,
    brokenCount,
    healthyCount,
    skippedCount,
    durationMs,
  };

  return { results, summary };
}

function emptyMetrics(): FetchTimingMetrics {
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
