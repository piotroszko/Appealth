import type { CheckResult } from "../../types.js";
import { XSS_PAYLOADS } from "./payloads.js";
import { matchXssReflection, tryFetch } from "./utils.js";

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
    for (const payload of XSS_PAYLOADS) {
      const injectedUrl = new URL(parsed.toString());
      injectedUrl.searchParams.set(param, originalValue + payload);

      const body = await tryFetch(injectedUrl.toString(), {
        method: request.method,
        headers: { ...request.requestHeaders },
      });

      if (!body) continue;

      if (matchXssReflection(body, payload)) {
        results.push({
          ...base,
          severity: "error",
          message: `Possible reflected XSS via query param "${param}"`,
          details: `Payload "${payload}" in param "${param}" was reflected unescaped in the response`,
        });
        break;
      }
    }
  }

  return results;
}
