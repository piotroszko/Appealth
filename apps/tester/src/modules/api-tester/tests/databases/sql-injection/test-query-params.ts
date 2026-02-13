import type { CheckResult } from "../../../types.js";
import { SQL_PAYLOADS } from "./payloads.js";
import { matchSqlError, tryFetch } from "./utils.js";

interface QueryParamRequest {
  url: string;
  method: string;
  requestHeaders: Record<string, string>;
  queryParams: Record<string, string>;
}

export async function testQueryParams(
  request: QueryParamRequest,
  base: { checkName: string; request: { url: string; method: string } },
): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const parsed = new URL(request.url);

  for (const [param, originalValue] of Object.entries(request.queryParams)) {
    for (const payload of SQL_PAYLOADS) {
      const injectedUrl = new URL(parsed.toString());
      injectedUrl.searchParams.set(param, originalValue + payload);

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
          message: `Possible SQL injection via query param "${param}" (${match.engine})`,
          details: `Payload "${payload}" in param "${param}" triggered ${match.engine} error pattern: ${match.pattern}`,
        });
        break;
      }
    }
  }

  return results;
}
