export interface CapturedRequest {
	url: string;
	method: string;
	resourceType: string;
	responseStatus: number | null;
	responseHeaders: Record<string, string> | null;
	sourcePageUrl: string;
}

export interface CrawlResult {
	domain: string;
	visitedUrls: string[];
	skippedUrls: string[];
	capturedRequests: CapturedRequest[];
	durationMs: number;
}

export interface DomainCrawlerOptions {
	maxPages?: number;
	maxCrawlTimeMs?: number;
	pageTimeoutMs?: number;
	concurrency?: number;
	parseSitemap?: boolean;
	headless?: boolean;
}
