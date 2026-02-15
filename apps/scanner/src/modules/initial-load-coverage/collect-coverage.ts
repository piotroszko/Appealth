import { chromium } from "playwright";
import type {
  CoverageOptions,
  FileCoverageResult,
  CoverageSummary,
  CollectCoverageResult,
} from "./types.js";

function mergeRanges(ranges: { start: number; end: number }[]): { start: number; end: number }[] {
  if (ranges.length === 0) return [];
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const merged: { start: number; end: number }[] = [
    { start: sorted[0]!.start, end: sorted[0]!.end },
  ];

  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1]!;
    const curr = sorted[i]!;
    if (curr.start <= last.end) {
      last.end = Math.max(last.end, curr.end);
    } else {
      merged.push({ start: curr.start, end: curr.end });
    }
  }

  return merged;
}

function isThirdPartyUrl(resourceUrl: string, targetDomain: string): boolean {
  try {
    const parsed = new URL(resourceUrl);
    if (parsed.protocol === "data:" || parsed.protocol === "blob:") return true;
    return parsed.hostname !== targetDomain;
  } catch {
    return true;
  }
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export async function collectCoverage(
  urls: string[],
  targetDomain: string,
  options: CoverageOptions,
): Promise<CollectCoverageResult> {
  const browser = await chromium.launch({ headless: true });

  try {
    const results: FileCoverageResult[] = [];
    const startTime = Date.now();

    for (const url of urls) {
      const context = await browser.newContext();
      const page = await context.newPage();

      try {
        await page.coverage.startJSCoverage({ resetOnNavigation: false });
        await page.coverage.startCSSCoverage({ resetOnNavigation: false });

        await page.goto(url, {
          waitUntil: options.waitUntil,
          timeout: options.timeoutMs,
        });

        const jsCoverage = await page.coverage.stopJSCoverage();
        const cssCoverage = await page.coverage.stopCSSCoverage();

        for (const entry of jsCoverage) {
          if (!entry.source) continue;
          const totalBytes = entry.source.length;

          const usedRanges: { start: number; end: number }[] = [];
          for (const fn of entry.functions) {
            for (const range of fn.ranges) {
              if (range.count > 0) {
                usedRanges.push({ start: range.startOffset, end: range.endOffset });
              }
            }
          }

          const merged = mergeRanges(usedRanges);
          const usedBytes = merged.reduce((sum, r) => sum + (r.end - r.start), 0);
          const unusedBytes = totalBytes - usedBytes;

          results.push({
            url: entry.url,
            type: "js",
            totalBytes,
            usedBytes,
            unusedBytes,
            usagePercent: totalBytes > 0 ? round((usedBytes / totalBytes) * 100, 2) : 0,
            isThirdParty: isThirdPartyUrl(entry.url, targetDomain),
          });
        }

        for (const entry of cssCoverage) {
          if (!entry.text) continue;
          const totalBytes = entry.text.length;

          const usedBytes = entry.ranges.reduce((sum, r) => sum + (r.end - r.start), 0);
          const unusedBytes = totalBytes - usedBytes;

          results.push({
            url: entry.url,
            type: "css",
            totalBytes,
            usedBytes,
            unusedBytes,
            usagePercent: totalBytes > 0 ? round((usedBytes / totalBytes) * 100, 2) : 0,
            isThirdParty: isThirdPartyUrl(entry.url, targetDomain),
          });
        }
      } finally {
        await context.close();
      }
    }

    const durationMs = Date.now() - startTime;

    const filtered = options.includeThirdParty ? results : results.filter((r) => !r.isThirdParty);

    const summary = buildSummary(filtered, durationMs);

    return { results: filtered, summary };
  } finally {
    await browser.close();
  }
}

function buildSummary(results: FileCoverageResult[], durationMs: number): CoverageSummary {
  const jsResults = results.filter((r) => r.type === "js");
  const cssResults = results.filter((r) => r.type === "css");

  const totalJsBytes = jsResults.reduce((sum, r) => sum + r.totalBytes, 0);
  const usedJsBytes = jsResults.reduce((sum, r) => sum + r.usedBytes, 0);
  const unusedJsBytes = jsResults.reduce((sum, r) => sum + r.unusedBytes, 0);

  const totalCssBytes = cssResults.reduce((sum, r) => sum + r.totalBytes, 0);
  const usedCssBytes = cssResults.reduce((sum, r) => sum + r.usedBytes, 0);
  const unusedCssBytes = cssResults.reduce((sum, r) => sum + r.unusedBytes, 0);

  const totalBytes = totalJsBytes + totalCssBytes;
  const usedBytes = usedJsBytes + usedCssBytes;

  return {
    totalJsFiles: jsResults.length,
    totalCssFiles: cssResults.length,
    totalJsBytes,
    usedJsBytes,
    unusedJsBytes,
    jsUsagePercent: totalJsBytes > 0 ? round((usedJsBytes / totalJsBytes) * 100, 2) : 0,
    totalCssBytes,
    usedCssBytes,
    unusedCssBytes,
    cssUsagePercent: totalCssBytes > 0 ? round((usedCssBytes / totalCssBytes) * 100, 2) : 0,
    overallUsagePercent: totalBytes > 0 ? round((usedBytes / totalBytes) * 100, 2) : 0,
    durationMs,
  };
}
