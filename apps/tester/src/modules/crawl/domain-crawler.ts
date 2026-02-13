import { chromium, type Browser, type Route } from "playwright";
import {
  BLOCKED_RESOURCE_TYPES,
  type CapturedRequest,
  type CrawlResult,
  type DomainCrawlerOptions,
} from "./types.js";
import { normalizeUrl, isSameDomain, shouldSkipByExtension } from "./utils/normalize-url.js";
import { extractLinks } from "./utils/extract-links.js";
import { parseSitemap } from "./utils/parse-sitemap.js";
const CAPTURE_BODY_TYPES = new Set(["xhr", "fetch", "websocket"]);
const IGNORED_REQUEST_HEADERS = new Set([
  "user-agent",
  "sec-ch-ua",
  "sec-ch-ua-mobile",
  "sec-ch-ua-platform",
  "sec-fetch-dest",
  "sec-fetch-mode",
  "sec-fetch-site",
  "sec-fetch-user",
  "upgrade-insecure-requests",
  "accept-encoding",
  "accept-language",
  "connection",
]);

function filterHeaders(headers: Record<string, string>): Record<string, string> {
  const filtered: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (!IGNORED_REQUEST_HEADERS.has(key.toLowerCase())) {
      filtered[key] = value;
    }
  }
  return filtered;
}

const DEFAULTS = {
  maxPages: 50,
  maxCrawlTimeMs: 120_000,
  pageTimeoutMs: 15_000,
  concurrency: 3,
  parseSitemap: true,
  headless: false,
} as const satisfies Required<DomainCrawlerOptions>;

function parseQueryParams(url: string): Record<string, string> {
  try {
    const params: Record<string, string> = {};
    for (const [key, value] of new URL(url).searchParams) {
      params[key] = value;
    }
    return params;
  } catch {
    return {};
  }
}

export class DomainCrawler {
  private browser: Browser | null = null;
  private readonly opts: Required<DomainCrawlerOptions>;

  constructor(options?: DomainCrawlerOptions) {
    this.opts = { ...DEFAULTS, ...options };
  }

  async crawl(domain: string): Promise<CrawlResult> {
    const startTime = Date.now();

    if (!this.browser) {
      this.browser = await chromium.launch({ headless: this.opts.headless });
    }

    const context = await this.browser.newContext();
    await context.route("**/*", (route: Route) => {
      if (BLOCKED_RESOURCE_TYPES.has(route.request().resourceType())) {
        return route.abort();
      }
      return route.continue();
    });

    const visited = new Set<string>();
    const skipped = new Set<string>();
    const capturedRequests: CapturedRequest[] = [];
    const queue: string[] = [];

    const seedUrl = normalizeUrl(`https://${domain}`);
    if (seedUrl) queue.push(seedUrl);

    if (this.opts.parseSitemap) {
      const sitemapUrls = await parseSitemap(domain);
      for (const raw of sitemapUrls) {
        const normalized = normalizeUrl(raw);
        if (normalized && isSameDomain(normalized, domain) && !shouldSkipByExtension(normalized)) {
          queue.push(normalized);
        }
      }
    }

    const enqueue = (urls: string[]) => {
      for (const raw of urls) {
        const normalized = normalizeUrl(raw);
        if (!normalized) continue;
        if (visited.has(normalized) || queue.includes(normalized)) continue;
        if (!isSameDomain(normalized, domain)) {
          skipped.add(normalized);
          continue;
        }
        if (shouldSkipByExtension(normalized)) {
          skipped.add(normalized);
          continue;
        }
        queue.push(normalized);
      }
    };

    const isTimedOut = () => Date.now() - startTime >= this.opts.maxCrawlTimeMs;

    const visitPage = async (url: string) => {
      const page = await context.newPage();
      const sourcePageUrl = url;

      page.on("requestfinished", async (request) => {
        const response = request.redirectedTo() ? null : await request.response();
        let responseBody: string | null = null;
        if (response && CAPTURE_BODY_TYPES.has(request.resourceType())) {
          try {
            responseBody = await response.text();
          } catch {
            // Body may be unavailable for redirected/aborted requests
          }
        }
        capturedRequests.push({
          url: request.url(),
          method: request.method(),
          resourceType: request.resourceType(),
          requestHeaders: filterHeaders(await request.allHeaders()),
          queryParams: parseQueryParams(request.url()),
          postData: request.postData(),
          responseStatus: response ? response.status() : null,
          responseHeaders: response ? await response.allHeaders() : null,
          responseBody,
          sourcePageUrl,
        });
      });

      page.on("requestfailed", async (request) => {
        capturedRequests.push({
          url: request.url(),
          method: request.method(),
          resourceType: request.resourceType(),
          requestHeaders: filterHeaders(await request.allHeaders()),
          queryParams: parseQueryParams(request.url()),
          postData: request.postData(),
          responseStatus: null,
          responseHeaders: null,
          responseBody: null,
          sourcePageUrl,
        });
      });

      try {
        await page.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: this.opts.pageTimeoutMs,
        });

        const finalUrl = page.url();
        if (!isSameDomain(finalUrl, domain)) {
          skipped.add(finalUrl);
          return;
        }

        const links = await extractLinks(page);
        enqueue(links);
      } catch {
        // Navigation errors are non-fatal — page is still closed below
      } finally {
        await page.close();
      }
    };

    while (queue.length > 0 && visited.size < this.opts.maxPages && !isTimedOut()) {
      const batch: string[] = [];
      while (batch.length < this.opts.concurrency && queue.length > 0) {
        const url = queue.shift()!;
        if (visited.has(url)) continue;
        visited.add(url);
        batch.push(url);
      }

      if (batch.length === 0) break;
      await Promise.all(batch.map(visitPage));
    }

    await context.close();

    return {
      domain,
      visitedUrls: [...visited],
      skippedUrls: [...skipped],
      capturedRequests,
      durationMs: Date.now() - startTime,
    };
  }

  async close(): Promise<void> {
    await this.browser?.close();
    this.browser = null;
  }
}
