import type { CapturedRequest } from "../../../../types/index.js";
import type { CheckResult } from "../../types.js";
import { StaticCheck } from "../static-check.js";

const SECURITY_HEADERS = [
  { header: "x-content-type-options", expected: "nosniff" },
  { header: "x-frame-options" },
  { header: "strict-transport-security" },
  { header: "content-security-policy" },
];

const DOCUMENT_TYPES = new Set(["document", "html"]);

export class ResponseHeadersCheck extends StaticCheck {
  readonly name = "response-headers";
  readonly description = "Checks for missing security headers on document responses";

  protected analyze(request: CapturedRequest): CheckResult[] {
    const { resourceType, responseHeaders } = request;
    const base = this.base(request);

    if (!DOCUMENT_TYPES.has(resourceType)) {
      return [];
    }

    if (!responseHeaders) {
      return [
        {
          ...base,
          severity: "warning",
          message: "No response headers available to check",
        },
      ];
    }

    const lowerHeaders = Object.fromEntries(
      Object.entries(responseHeaders).map(([k, v]) => [k.toLowerCase(), v]),
    );

    const results: CheckResult[] = [];

    for (const { header, expected } of SECURITY_HEADERS) {
      const value = lowerHeaders[header];
      if (!value) {
        results.push({
          ...base,
          severity: "warning",
          message: `Missing security header: ${header}`,
          details: `The response does not include the ${header} header`,
        });
      } else if (expected && value.toLowerCase() !== expected) {
        results.push({
          ...base,
          severity: "warning",
          message: `Unexpected value for ${header}: "${value}"`,
          details: `Expected "${expected}" but got "${value}"`,
        });
      }
    }

    return results;
  }
}
