import type { CapturedRequest } from "../../../../types/index.js";
import type { CheckResult } from "../../types.js";
import { StaticCheck } from "../static-check.js";

const SENSITIVE_KEYS = new Set([
  "password",
  "passwd",
  "pass",
  "token",
  "secret",
  "api_key",
  "apikey",
  "api-key",
  "access_token",
  "auth",
  "credential",
  "private_key",
  "client_secret",
]);

export class SensitiveDataCheck extends StaticCheck {
  readonly name = "sensitive-data";
  readonly description = "Flags query parameters with sensitive-looking keys";

  protected analyze(request: CapturedRequest): CheckResult[] {
    const { queryParams } = request;
    const base = this.base(request);

    const results: CheckResult[] = [];

    for (const key of Object.keys(queryParams)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        results.push({
          ...base,
          severity: "error",
          message: `Sensitive parameter "${key}" found in query string`,
          details: `The query parameter "${key}" may contain sensitive data and should not be passed in the URL`,
        });
      }
    }

    return results;
  }
}
