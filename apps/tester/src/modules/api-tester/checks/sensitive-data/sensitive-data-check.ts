import type { CapturedRequest } from "../../../../types/index.js";
import type { CheckContext, CheckResult } from "../../types.js";
import type { HttpClient } from "../../http-client.js";
import { isAllowedDomain } from "../../utils.js";
import { BaseCheck } from "../base-check.js";
import { MALFORMED_JSON_PAYLOADS, WRONG_CONTENT_TYPES, ERROR_TRIGGER_PATHS } from "./patterns.js";
import {
  detectSensitiveQueryParams,
  detectVersionHeaders,
  analyzeResponseBody,
  analyzeErrorResponse,
} from "./utils.js";

export class SensitiveDataCheck extends BaseCheck {
  readonly name = "sensitive-data";
  readonly description =
    "Detects sensitive data in query params, version disclosure in headers, and verbose error responses leaking internals";

  private readonly probedOrigins = new Set<string>();

  async run(request: CapturedRequest, context: CheckContext): Promise<CheckResult[]> {
    const base = this.base(request);
    const results: CheckResult[] = [];

    // Phase 1 — Static analysis (always runs)
    for (const f of detectSensitiveQueryParams(request.queryParams)) {
      results.push({ ...base, ...f });
    }

    if (request.responseHeaders) {
      for (const f of detectVersionHeaders(request.responseHeaders)) {
        results.push({ ...base, ...f });
      }
    }

    if (request.responseBody) {
      for (const f of analyzeResponseBody(request.responseBody)) {
        results.push({ ...base, ...f });
      }
    }

    // Phase 2 — Active probing (domain-gated, deduplicated per origin)
    if (!isAllowedDomain(request.url, context.options.domains)) {
      return results;
    }

    let origin: string;
    try {
      const u = new URL(request.url);
      origin = `${u.protocol}//${u.host}`;
    } catch {
      return results;
    }

    if (this.probedOrigins.has(origin)) {
      return results;
    }
    this.probedOrigins.add(origin);

    const probeBase = { checkName: this.name, request: { url: origin, method: "PROBE" } };
    const { httpClient } = context;

    const probeResults = await Promise.all([
      this.probeWithMalformedJson(origin, request, httpClient, probeBase),
      this.probeWithWrongContentTypes(origin, request, httpClient, probeBase),
      this.probeErrorPaths(origin, httpClient, probeBase),
      this.probeWithCorruptedParams(request, httpClient, probeBase),
    ]);

    return results.concat(probeResults.flat());
  }

  private async probeWithMalformedJson(
    _origin: string,
    request: CapturedRequest,
    httpClient: HttpClient,
    base: CheckResult["request"] extends infer R ? { checkName: string; request: R } : never,
  ): Promise<CheckResult[]> {
    const contentType = Object.entries(request.requestHeaders).find(
      ([k]) => k.toLowerCase() === "content-type",
    )?.[1];
    if (!contentType?.includes("json")) return [];

    for (const { label, body } of MALFORMED_JSON_PAYLOADS) {
      const responseBody = await httpClient.tryFetch(request.url, {
        method: request.method === "GET" ? "POST" : request.method,
        headers: { ...request.requestHeaders, "content-type": "application/json" },
        body,
      });

      if (!responseBody) continue;

      const findings = analyzeErrorResponse(responseBody, `${label} payload`);
      if (findings.length > 0) {
        return findings.map((f) => ({ ...base, ...f }));
      }
    }

    return [];
  }

  private async probeWithWrongContentTypes(
    _origin: string,
    request: CapturedRequest,
    httpClient: HttpClient,
    base: CheckResult["request"] extends infer R ? { checkName: string; request: R } : never,
  ): Promise<CheckResult[]> {
    const method = request.method.toUpperCase();
    if (!["POST", "PUT", "PATCH"].includes(method)) return [];

    for (const ct of WRONG_CONTENT_TYPES) {
      const responseBody = await httpClient.tryFetch(request.url, {
        method,
        headers: { ...request.requestHeaders, "content-type": ct },
        body: "test",
      });

      if (!responseBody) continue;

      const findings = analyzeErrorResponse(responseBody, `wrong content-type "${ct}"`);
      if (findings.length > 0) {
        return findings.map((f) => ({ ...base, ...f }));
      }
    }

    return [];
  }

  private async probeErrorPaths(
    origin: string,
    httpClient: HttpClient,
    base: CheckResult["request"] extends infer R ? { checkName: string; request: R } : never,
  ): Promise<CheckResult[]> {
    for (const path of ERROR_TRIGGER_PATHS) {
      const responseBody = await httpClient.tryFetch(`${origin}${path}`, {
        method: "GET",
      });

      if (!responseBody) continue;

      const findings = analyzeErrorResponse(responseBody, `error path "${path}"`);
      if (findings.length > 0) {
        return findings.map((f) => ({ ...base, ...f }));
      }
    }

    return [];
  }

  private async probeWithCorruptedParams(
    request: CapturedRequest,
    httpClient: HttpClient,
    base: CheckResult["request"] extends infer R ? { checkName: string; request: R } : never,
  ): Promise<CheckResult[]> {
    const params = Object.keys(request.queryParams);
    if (params.length === 0) return [];

    const corruptions = [
      { label: "overflow value", value: "A".repeat(10000) },
      { label: "template syntax", value: "{{7*7}}${7*7}<%= 7*7 %>" },
      { label: "special characters", value: "\x00\x1f\x7f\xff" },
      { label: "negative number", value: "-99999999999999" },
    ];

    const param = params[0]!;

    for (const { label, value } of corruptions) {
      const url = new URL(request.url);
      url.searchParams.set(param, value);

      const responseBody = await httpClient.tryFetch(url.toString(), {
        method: request.method,
        headers: { ...request.requestHeaders },
      });

      if (!responseBody) continue;

      const findings = analyzeErrorResponse(
        responseBody,
        `corrupted param "${param}" with ${label}`,
      );
      if (findings.length > 0) {
        return findings.map((f) => ({ ...base, ...f }));
      }
    }

    return [];
  }
}
