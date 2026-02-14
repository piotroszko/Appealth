import type { CheckResult } from "../types.js";
import { throttledFetch } from "../worker/fetch-wrapper.js";

export interface InjectionConfig {
  payloads: string[];
  match(body: string, payload: string): { suffix: string; explanation: string } | null;
  vulnLabel: string;
}

export const INJECTABLE_HEADERS = new Set([
  "cookie",
  "referer",
  "user-agent",
  "x-forwarded-for",
  "x-forwarded-host",
  "x-request-id",
  "x-api-key",
  "authorization",
]);

export function parseBodyFields(
  postData: string,
  contentType: string | undefined,
): Record<string, string> | null {
  if (!postData) return null;

  if (contentType?.includes("application/json")) {
    try {
      const parsed = JSON.parse(postData);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        const fields: Record<string, string> = {};
        for (const [key, value] of Object.entries(parsed)) {
          if (typeof value === "string" || typeof value === "number") {
            fields[key] = String(value);
          }
        }
        return Object.keys(fields).length > 0 ? fields : null;
      }
    } catch {
      return null;
    }
  }

  if (!contentType || contentType.includes("application/x-www-form-urlencoded")) {
    try {
      const params = new URLSearchParams(postData);
      const fields: Record<string, string> = {};
      for (const [key, value] of params.entries()) {
        fields[key] = value;
      }
      return Object.keys(fields).length > 0 ? fields : null;
    } catch {
      return null;
    }
  }

  return null;
}

export async function tryFetch(url: string, init: RequestInit): Promise<string | null> {
  try {
    const res = await throttledFetch(url, init);
    return await res.text();
  } catch {
    return null;
  }
}

export async function testQueryParams(
  request: {
    url: string;
    method: string;
    requestHeaders: Record<string, string>;
    queryParams: Record<string, string>;
  },
  base: { checkName: string; request: { url: string; method: string } },
  config: InjectionConfig,
): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const parsed = new URL(request.url);

  for (const [param, originalValue] of Object.entries(request.queryParams)) {
    for (const payload of config.payloads) {
      const injectedUrl = new URL(parsed.toString());
      injectedUrl.searchParams.set(param, originalValue + payload);

      const body = await tryFetch(injectedUrl.toString(), {
        method: request.method,
        headers: { ...request.requestHeaders },
      });

      if (!body) continue;

      const match = config.match(body, payload);
      if (match) {
        results.push({
          ...base,
          severity: "error",
          message: `Possible ${config.vulnLabel} via query param "${param}"${match.suffix}`,
          details: `Payload "${payload}" in param "${param}" ${match.explanation}`,
        });
        break;
      }
    }
  }

  return results;
}

export async function testHeaders(
  request: { url: string; method: string; requestHeaders: Record<string, string> },
  base: { checkName: string; request: { url: string; method: string } },
  config: InjectionConfig,
): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  const headersToTest = Object.entries(request.requestHeaders).filter(([k]) =>
    INJECTABLE_HEADERS.has(k.toLowerCase()),
  );

  for (const [header, originalValue] of headersToTest) {
    for (const payload of config.payloads) {
      const injectedHeaders = {
        ...request.requestHeaders,
        [header]: originalValue + payload,
      };

      const body = await tryFetch(request.url, {
        method: request.method,
        headers: injectedHeaders,
      });

      if (!body) continue;

      const match = config.match(body, payload);
      if (match) {
        results.push({
          ...base,
          severity: "error",
          message: `Possible ${config.vulnLabel} via header "${header}"${match.suffix}`,
          details: `Payload "${payload}" in header "${header}" ${match.explanation}`,
        });
        break;
      }
    }
  }

  return results;
}

export async function testUrlPath(
  request: { url: string; method: string; requestHeaders: Record<string, string> },
  base: { checkName: string; request: { url: string; method: string } },
  config: InjectionConfig,
): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const parsed = new URL(request.url);
  const basePath = parsed.pathname.endsWith("/") ? parsed.pathname : `${parsed.pathname}/`;

  for (const payload of config.payloads) {
    const injectedUrl = new URL(parsed.toString());
    injectedUrl.pathname = basePath + encodeURIComponent(payload);

    const body = await tryFetch(injectedUrl.toString(), {
      method: request.method,
      headers: { ...request.requestHeaders },
    });

    if (!body) continue;

    const match = config.match(body, payload);
    if (match) {
      results.push({
        ...base,
        severity: "error",
        message: `Possible ${config.vulnLabel} via URL path${match.suffix}`,
        details: `Payload "${payload}" appended to path ${match.explanation}`,
      });
      break;
    }
  }

  return results;
}

export async function testBodyFields(
  request: {
    url: string;
    method: string;
    requestHeaders: Record<string, string>;
    postData: string | null;
  },
  fields: Record<string, string>,
  contentType: string | undefined,
  base: { checkName: string; request: { url: string; method: string } },
  config: InjectionConfig,
): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const isJson = contentType?.includes("application/json");

  for (const [field, originalValue] of Object.entries(fields)) {
    for (const payload of config.payloads) {
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

      const match = config.match(body, payload);
      if (match) {
        results.push({
          ...base,
          severity: "error",
          message: `Possible ${config.vulnLabel} via body field "${field}"${match.suffix}`,
          details: `Payload "${payload}" in field "${field}" ${match.explanation}`,
        });
        break;
      }
    }
  }

  return results;
}
