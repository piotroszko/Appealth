import type { CapturedRequest } from "../../../../types/index.js";
import type { CheckResult } from "../../types.js";
import { StaticCheck } from "../static-check.js";

export class HttpsCheck extends StaticCheck {
  readonly name = "https";
  readonly description = "Flags any URL using http:// instead of https://";

  protected analyze(request: CapturedRequest): CheckResult[] {
    const base = this.base(request);

    if (request.url.startsWith("http://")) {
      return [
        {
          ...base,
          severity: "warning",
          message: "Insecure HTTP request detected",
          details: `Request to ${request.url} uses http:// instead of https://`,
        },
      ];
    }

    return [];
  }
}
