import type { CheckResult } from "../../types.js";
import type { ProbePath, ProbeResult } from "./types.js";

const FETCH_TIMEOUT_MS = 5_000;

const SOFT_404_PATTERNS = [
  /page\s+not\s+found/i,
  /404\s+not\s+found/i,
  /not\s+found/i,
  /does\s+not\s+exist/i,
  /no\s+such\s+(page|file|resource)/i,
  /the\s+requested\s+URL\s+was\s+not\s+found/i,
];

export async function tryProbe(url: string): Promise<ProbeResult | null> {
  try {
    const res = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SecurityScanner/1.0)" },
    });

    const body = await res.text();
    const headers: Record<string, string> = {};
    res.headers.forEach((v, k) => {
      headers[k] = v;
    });

    return { status: res.status, body, headers };
  } catch {
    return null;
  }
}

export function buildBaseUrl(url: string): string {
  const u = new URL(url);
  return `${u.protocol}//${u.host}`;
}

export function isSoft404(body: string): boolean {
  return SOFT_404_PATTERNS.some((p) => p.test(body));
}

export function isVulnerable(probe: ProbePath, result: ProbeResult): boolean {
  if (result.status !== 200) return false;
  if (isSoft404(result.body)) return false;

  if (probe.statusOnly) {
    return result.body.length >= (probe.minBodyLength ?? 0);
  }

  if (probe.minBodyLength && result.body.length < probe.minBodyLength) {
    return false;
  }

  return probe.bodyPatterns.some((p) => p.test(result.body));
}

export async function runCategory(
  baseUrl: string,
  paths: readonly ProbePath[],
  base: { checkName: string; request: { url: string; method: string } },
): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  for (const probe of paths) {
    const url = `${baseUrl}/${probe.path}`;
    const result = await tryProbe(url);
    if (!result) continue;

    if (isVulnerable(probe, result)) {
      results.push({
        ...base,
        severity: probe.severity,
        message: probe.label,
        details: `${url} returned HTTP ${result.status} with matching content (${result.body.length} bytes)`,
      });
    }
  }

  return results;
}
