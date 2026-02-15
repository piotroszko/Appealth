import type { SsrfPayload } from "./types.js";
import { SSRF_PAYLOADS } from "./payloads.js";

const payloadMap = new Map<string, SsrfPayload>(SSRF_PAYLOADS.map((p) => [p.url, p]));

export function matchSsrfResponse(
  body: string,
  payload: string,
): { category: string; label: string; evidence: string } | undefined {
  const entry = payloadMap.get(payload);
  if (!entry) return undefined;

  for (const pattern of entry.patterns) {
    const m = pattern.exec(body);
    if (m) {
      const evidence = m[0].length > 80 ? m[0].slice(0, 80) + "..." : m[0];
      return { category: entry.category, label: entry.label, evidence };
    }
  }

  return undefined;
}
