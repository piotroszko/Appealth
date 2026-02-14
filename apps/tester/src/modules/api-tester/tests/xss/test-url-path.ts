import type { CheckResult } from "../../types.js";
import { XSS_PAYLOADS } from "./payloads.js";
import { matchXssReflection, tryFetch } from "./utils.js";

export async function testUrlPath(
  request: { url: string; method: string; requestHeaders: Record<string, string> },
  base: { checkName: string; request: { url: string; method: string } },
): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const parsed = new URL(request.url);
  const basePath = parsed.pathname.endsWith("/") ? parsed.pathname : `${parsed.pathname}/`;

  for (const payload of XSS_PAYLOADS) {
    const injectedUrl = new URL(parsed.toString());
    injectedUrl.pathname = basePath + encodeURIComponent(payload);

    const body = await tryFetch(injectedUrl.toString(), {
      method: request.method,
      headers: { ...request.requestHeaders },
    });

    if (!body) continue;

    if (matchXssReflection(body, payload)) {
      results.push({
        ...base,
        severity: "error",
        message: "Possible reflected XSS via URL path",
        details: `Payload "${payload}" appended to path was reflected unescaped in the response`,
      });
      break;
    }
  }

  return results;
}
