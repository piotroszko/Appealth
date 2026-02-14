import type { InjectionConfig } from "../injection-check.js";
import { InjectionCheck } from "../injection-check.js";
import { COMMAND_INJECTION_PAYLOAD_STRINGS } from "./payloads.js";
import { matchCommandOutput } from "./utils.js";

export class CommandInjectionCheck extends InjectionCheck {
  readonly name = "command-injection";
  readonly description =
    "Attempts OS command injection on query params, body fields, URL path, and headers, flags responses containing command output patterns";

  protected readonly config: InjectionConfig = {
    payloads: COMMAND_INJECTION_PAYLOAD_STRINGS,
    vulnLabel: "command injection",
    match(body, payload) {
      const m = matchCommandOutput(body, payload);
      if (!m) return null;
      return {
        suffix: ` (${m.os})`,
        explanation: `triggered command output pattern: "${m.evidence}"`,
      };
    },
  };
}
