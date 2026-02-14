import type { CapturedRequest } from "../../../../types/index.js";
import type { CheckResult } from "../../types.js";
import { StaticCheck } from "../static-check.js";

const SENSITIVE_HEADERS = ["authorization", "cookie", "set-cookie"];

export class AuthHeadersCheck extends StaticCheck {
  readonly name = "auth-headers";
  readonly description = "Flags Authorization/Cookie headers sent over non-HTTPS connections";

  protected analyze(request: CapturedRequest): CheckResult[] {
    const { url, requestHeaders } = request;
    const base = this.base(request);

    if (!url.startsWith("http://")) {
      return [];
    }

    const lowerHeaders = Object.fromEntries(
      Object.entries(requestHeaders).map(([k, v]) => [k.toLowerCase(), v]),
    );

    const results: CheckResult[] = [];

    for (const header of SENSITIVE_HEADERS) {
      if (lowerHeaders[header]) {
        results.push({
          ...base,
          severity: "error",
          message: `Sensitive header "${header}" sent over HTTP`,
          details: `The ${header} header is being transmitted over an unencrypted connection`,
        });
      }
    }

    return results;
  }
}
