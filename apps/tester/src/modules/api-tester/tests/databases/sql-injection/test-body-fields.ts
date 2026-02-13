import type { CheckResult } from "../../../types.js";
import { SQL_PAYLOADS } from "./payloads.js";
import { matchSqlError, tryFetch } from "./utils.js";

interface BodyFieldRequest {
  url: string;
  method: string;
  requestHeaders: Record<string, string>;
  postData: string | null;
}

export async function testBodyFields(
  request: BodyFieldRequest,
  fields: Record<string, string>,
  contentType: string | undefined,
  base: { checkName: string; request: { url: string; method: string } },
): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const isJson = contentType?.includes("application/json");

  for (const [field, originalValue] of Object.entries(fields)) {
    for (const payload of SQL_PAYLOADS) {
      const injectedValue = originalValue + payload;
      let injectedBody: string;
      let bodyContentType: string;

      if (isJson) {
        const original = JSON.parse(request.postData!);
        original[field] = injectedValue;
        injectedBody = JSON.stringify(original);
        bodyContentType = "application/json";
      } else {
        const params = new URLSearchParams(request.postData!);
        params.set(field, injectedValue);
        injectedBody = params.toString();
        bodyContentType = "application/x-www-form-urlencoded";
      }

      const headers = { ...request.requestHeaders, "content-type": bodyContentType };
      const body = await tryFetch(request.url, {
        method: request.method,
        headers,
        body: injectedBody,
      });

      if (!body) continue;

      const match = matchSqlError(body);
      if (match) {
        results.push({
          ...base,
          severity: "error",
          message: `Possible SQL injection via body field "${field}" (${match.engine})`,
          details: `Payload "${payload}" in field "${field}" triggered ${match.engine} error pattern: ${match.pattern}`,
        });
        break;
      }
    }
  }

  return results;
}
