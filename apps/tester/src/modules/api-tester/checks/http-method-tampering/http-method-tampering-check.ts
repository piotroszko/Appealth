import type { CapturedRequest } from "../../../../types/index.js";
import type { CheckContext, CheckResult } from "../../types.js";
import { isAllowedDomain } from "../../utils.js";
import { BaseCheck } from "../base-check.js";

const TAMPER_METHODS = ["PUT", "DELETE", "PATCH"] as const;

export class HttpMethodTamperingCheck extends BaseCheck {
  readonly name = "http-method-tampering";
  readonly description =
    "Tries PUT/DELETE/PATCH on endpoints that only expect GET, flags unexpected 2xx success responses";

  private readonly probedUrls = new Set<string>();

  async run(request: CapturedRequest, context: CheckContext): Promise<CheckResult[]> {
    if (request.method.toUpperCase() !== "GET") {
      return [];
    }

    if (!isAllowedDomain(request.url, context.options.domains)) {
      return [];
    }

    let canonical: string;
    try {
      const u = new URL(request.url);
      u.search = "";
      u.hash = "";
      canonical = u.toString();
    } catch {
      return [];
    }

    if (this.probedUrls.has(canonical)) {
      return [];
    }
    this.probedUrls.add(canonical);

    const base = this.base(request);
    const results: CheckResult[] = [];

    const probes = TAMPER_METHODS.map((method) => this.probe(request, method, context));
    const outcomes = await Promise.all(probes);

    for (const outcome of outcomes) {
      if (outcome) {
        results.push({ ...base, ...outcome });
      }
    }

    return results;
  }

  private async probe(
    request: CapturedRequest,
    method: string,
    context: CheckContext,
  ): Promise<Pick<CheckResult, "severity" | "message" | "details"> | null> {
    try {
      const res = await context.httpClient.fetch(request.url, {
        method,
        headers: request.requestHeaders,
      });
      await res.text();

      if (res.status >= 200 && res.status < 300) {
        return {
          severity: "warning",
          message: `Endpoint accepted ${method} unexpectedly (HTTP ${res.status})`,
          details: `${request.url} returned ${res.status} for ${method} — expected GET-only endpoint should reject other methods with 405 Method Not Allowed`,
        };
      }
    } catch {
      // network error — skip
    }

    return null;
  }
}
