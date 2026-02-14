import type { CheckResult } from "../../types.js";
import { XSS_PAYLOADS } from "./payloads.js";
import { matchXssReflection, tryFetch } from "./utils.js";

const INJECTABLE_HEADERS = new Set([
  "cookie",
  "referer",
  "user-agent",
  "x-forwarded-for",
  "x-forwarded-host",
  "x-request-id",
  "x-api-key",
  "authorization",
]);

export async function testHeaders(
  request: { url: string; method: string; requestHeaders: Record<string, string> },
  base: { checkName: string; request: { url: string; method: string } },
): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  const headersToTest = Object.entries(request.requestHeaders).filter(([k]) =>
    INJECTABLE_HEADERS.has(k.toLowerCase()),
  );

  for (const [header, originalValue] of headersToTest) {
    for (const payload of XSS_PAYLOADS) {
      const injectedHeaders = {
        ...request.requestHeaders,
        [header]: originalValue + payload,
      };

      const body = await tryFetch(request.url, {
        method: request.method,
        headers: injectedHeaders,
      });

      if (!body) continue;

      if (matchXssReflection(body, payload)) {
        results.push({
          ...base,
          severity: "error",
          message: `Possible reflected XSS via header "${header}"`,
          details: `Payload "${payload}" in header "${header}" was reflected unescaped in the response`,
        });
        break;
      }
    }
  }

  return results;
}
