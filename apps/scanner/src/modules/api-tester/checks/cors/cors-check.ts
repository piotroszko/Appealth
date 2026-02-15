import type { CapturedRequest } from "../../../../types/index.js";
import type { CheckContext, CheckResult } from "../../types.js";
import { isAllowedDomain } from "../../utils.js";
import { BaseCheck } from "../base-check.js";
import { EVIL_ORIGIN, NULL_ORIGIN, analyzeCorsResponse, extractCorsHeaders } from "./utils.js";

export class CorsCheck extends BaseCheck {
  readonly name = "cors";
  readonly description =
    "Detects CORS misconfigurations by probing with crafted Origin headers (arbitrary origin reflection, null origin, wildcard)";

  private readonly probedOrigins = new Set<string>();

  async run(request: CapturedRequest, context: CheckContext): Promise<CheckResult[]> {
    const { url } = request;

    if (!isAllowedDomain(url, context.options.domains)) {
      return [];
    }

    let baseUrl: string;
    try {
      const u = new URL(url);
      baseUrl = `${u.protocol}//${u.host}`;
    } catch {
      return [];
    }

    if (this.probedOrigins.has(baseUrl)) {
      return [];
    }
    this.probedOrigins.add(baseUrl);

    const base = { checkName: this.name, request: { url: baseUrl, method: request.method } };
    const results: CheckResult[] = [];

    const evilResult = await this.probe(url, request, context, EVIL_ORIGIN);
    if (evilResult) {
      const finding = analyzeCorsResponse(EVIL_ORIGIN, evilResult, base, baseUrl);
      if (finding) results.push(finding);
    }

    const nullResult = await this.probe(url, request, context, NULL_ORIGIN);
    if (nullResult) {
      const finding = analyzeCorsResponse(NULL_ORIGIN, nullResult, base, baseUrl);
      // Only add wildcard findings from the null probe if we didn't already find a reflected origin
      if (finding && !(finding.message.includes("Wildcard") && results.length > 0)) {
        results.push(finding);
      }
    }

    return results;
  }

  private async probe(
    url: string,
    request: CapturedRequest,
    context: CheckContext,
    origin: string,
  ): Promise<ReturnType<typeof extractCorsHeaders> | null> {
    try {
      const res = await context.httpClient.fetch(url, {
        method: request.method,
        headers: { ...request.requestHeaders, Origin: origin },
      });
      await res.text();
      return extractCorsHeaders(res.headers);
    } catch {
      return null;
    }
  }
}
