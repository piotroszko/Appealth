import type { CapturedRequest } from "../../../../types/index.js";
import type { CheckResult } from "../../types.js";
import { StaticCheck } from "../static-check.js";
import { detectDomXssPatterns } from "./dom-xss-patterns.js";

export class DomXssCheck extends StaticCheck {
  readonly name = "dom-xss";
  readonly description =
    "Static analysis of response JavaScript for DOM-based XSS patterns (sources flowing into sinks)";

  protected analyze(request: CapturedRequest): CheckResult[] {
    const { responseBody } = request;
    if (!responseBody) return [];

    const base = this.base(request);
    const findings = detectDomXssPatterns(responseBody);

    return findings.map((f) => ({
      ...base,
      severity: "warning" as const,
      message: `Potential DOM-based XSS: ${f.source} → ${f.sink}`,
      details: `Response JS reads from "${f.source}" and writes to ${f.sink}. Snippet: ${f.scriptSnippet}`,
    }));
  }
}
