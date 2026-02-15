import type { InjectionConfig } from "../injection-check.js";
import { InjectionCheck } from "../injection-check.js";
import { SSRF_PAYLOAD_STRINGS } from "./payloads.js";
import { matchSsrfResponse } from "./utils.js";

export class SsrfCheck extends InjectionCheck {
  readonly name = "ssrf";
  readonly description =
    "Injects internal/metadata URLs into query params, body fields, and headers to detect SSRF vulnerabilities";

  protected readonly config: InjectionConfig = {
    payloads: SSRF_PAYLOAD_STRINGS,
    vulnLabel: "SSRF",
    replaceValue: true,
    skipUrlPath: true,
    match(body, payload) {
      const m = matchSsrfResponse(body, payload);
      if (!m) return null;
      return {
        suffix: ` (${m.category})`,
        explanation: `triggered ${m.label} pattern: "${m.evidence}"`,
      };
    },
  };
}
