import type { CapturedRequest } from "../../../../types/index.js";
import type { CheckResult } from "../../types.js";
import { StaticCheck } from "../static-check.js";
import { extractSetCookieHeaders, parseCookie, analyzeCookie } from "./utils.js";

export class CookieSecurityCheck extends StaticCheck {
  readonly name = "cookie-security";
  readonly description =
    "Checks Set-Cookie headers for missing HttpOnly, Secure, and SameSite flags";

  protected analyze(request: CapturedRequest): CheckResult[] {
    if (!request.responseHeaders) return [];

    const setCookieHeaders = extractSetCookieHeaders(request.responseHeaders);
    if (setCookieHeaders.length === 0) return [];

    const base = this.base(request);
    const results: CheckResult[] = [];

    for (const header of setCookieHeaders) {
      const cookie = parseCookie(header);
      if (!cookie) continue;

      const findings = analyzeCookie(cookie);
      for (const finding of findings) {
        results.push({
          ...base,
          severity: finding.severity,
          message: finding.message,
          details: finding.details,
        });
      }
    }

    return results;
  }
}
