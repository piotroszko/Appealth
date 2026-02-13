export type { CapturedRequest } from "../../types/index.js";

import type { CapturedRequest } from "../../types/index.js";

export interface CrawlResult {
	domain: string;
	visitedUrls: string[];
	skippedUrls: string[];
	capturedRequests: CapturedRequest[];
	durationMs: number;
}

export const BLOCKED_RESOURCE_TYPES = new Set(["image", "media", "font", "stylesheet"]);

export interface DomainCrawlerOptions {
	maxPages?: number;
	maxCrawlTimeMs?: number;
	pageTimeoutMs?: number;
	concurrency?: number;
	parseSitemap?: boolean;
	headless?: boolean;
}
