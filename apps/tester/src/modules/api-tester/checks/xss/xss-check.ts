import type { InjectionConfig } from "../injection-check.js";
import { InjectionCheck } from "../injection-check.js";
import { XSS_PAYLOADS } from "./payloads.js";
import { matchXssReflection } from "./utils.js";

export class XssCheck extends InjectionCheck {
  readonly name = "xss";
  readonly description =
    "Attempts reflected XSS on query params, body fields, URL path, and headers, flags responses where payloads are reflected unescaped";

  protected readonly config: InjectionConfig = {
    payloads: XSS_PAYLOADS,
    vulnLabel: "reflected XSS",
    match(body, payload) {
      if (!matchXssReflection(body, payload)) return null;
      return {
        suffix: "",
        explanation: "was reflected unescaped in the response",
      };
    },
  };
}
