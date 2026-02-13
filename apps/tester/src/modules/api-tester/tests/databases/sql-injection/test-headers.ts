import type { CheckResult } from "../../../types.js";
import { SQL_PAYLOADS } from "./payloads.js";
import { matchSqlError, tryFetch } from "./utils.js";

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
    for (const payload of SQL_PAYLOADS) {
      const injectedHeaders = {
        ...request.requestHeaders,
        [header]: originalValue + payload,
      };

      const body = await tryFetch(request.url, {
        method: request.method,
        headers: injectedHeaders,
      });

      if (!body) continue;

      const match = matchSqlError(body);
      if (match) {
        results.push({
          ...base,
          severity: "error",
          message: `Possible SQL injection via header "${header}" (${match.engine})`,
          details: `Payload "${payload}" in header "${header}" triggered ${match.engine} error pattern: ${match.pattern}`,
        });
        break;
      }
    }
  }

  return results;
}
