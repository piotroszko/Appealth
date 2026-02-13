import type { CheckResult } from "../../../types.js";
import { SQL_PAYLOADS } from "./payloads.js";
import { matchSqlError, tryFetch } from "./utils.js";

export async function testUrlPath(
  request: { url: string; method: string; requestHeaders: Record<string, string> },
  base: { checkName: string; request: { url: string; method: string } },
): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const parsed = new URL(request.url);
  const basePath = parsed.pathname.endsWith("/") ? parsed.pathname : `${parsed.pathname}/`;

  for (const payload of SQL_PAYLOADS) {
    const injectedUrl = new URL(parsed.toString());
    injectedUrl.pathname = basePath + encodeURIComponent(payload);

    const body = await tryFetch(injectedUrl.toString(), {
      method: request.method,
      headers: { ...request.requestHeaders },
    });

    if (!body) continue;

    const match = matchSqlError(body);
    if (match) {
      results.push({
        ...base,
        severity: "error",
        message: `Possible SQL injection via URL path (${match.engine})`,
        details: `Payload "${payload}" appended to path triggered ${match.engine} error pattern: ${match.pattern}`,
      });
      break;
    }
  }

  return results;
}
