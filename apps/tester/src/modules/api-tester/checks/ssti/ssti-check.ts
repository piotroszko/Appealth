import type { InjectionConfig } from "../injection-check.js";
import { InjectionCheck } from "../injection-check.js";
import { SSTI_PAYLOAD_STRINGS } from "./payloads.js";
import { matchSstiOutput } from "./utils.js";

export class SstiCheck extends InjectionCheck {
  readonly name = "ssti";
  readonly description =
    "Attempts server-side template injection on query params, body fields, URL path, and headers, flags responses containing evaluated template expressions or template engine errors";

  protected readonly config: InjectionConfig = {
    payloads: SSTI_PAYLOAD_STRINGS,
    vulnLabel: "server-side template injection",
    match(body, payload) {
      const m = matchSstiOutput(body, payload);
      if (!m) return null;
      return {
        suffix: ` (${m.engine})`,
        explanation: `triggered ${m.engine} template evaluation: "${m.evidence}"`,
      };
    },
  };
}
