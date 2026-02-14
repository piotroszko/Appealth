import type { CheckSeverity } from "../../types.js";
import type { InfoLeakPattern } from "./patterns.js";
import {
  SENSITIVE_KEYS,
  STACK_TRACE_PATTERNS,
  VERSION_HEADER_NAMES,
  VERSION_HEADER_PATTERNS,
  FRAMEWORK_BODY_PATTERNS,
  INTERNAL_PATH_PATTERNS,
  DB_ERROR_PATTERNS,
  DEBUG_PATTERNS,
} from "./patterns.js";

export interface Finding {
  severity: CheckSeverity;
  message: string;
  details: string;
}

function scanPatterns(
  body: string,
  patterns: InfoLeakPattern[],
  severity: CheckSeverity,
): Finding[] {
  const seen = new Set<string>();
  const findings: Finding[] = [];

  for (const { label, pattern } of patterns) {
    if (seen.has(label)) continue;
    if (pattern.test(body)) {
      seen.add(label);
      findings.push({
        severity,
        message: `Information leak: ${label} detected in response body`,
        details: `Pattern matched: ${pattern.source}`,
      });
    }
  }

  return findings;
}

export function detectSensitiveQueryParams(queryParams: Record<string, string>): Finding[] {
  const findings: Finding[] = [];

  for (const key of Object.keys(queryParams)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      findings.push({
        severity: "error",
        message: `Sensitive parameter "${key}" found in query string`,
        details: `The query parameter "${key}" may contain sensitive data and should not be passed in the URL`,
      });
    }
  }

  return findings;
}

export function detectVersionHeaders(responseHeaders: Record<string, string>): Finding[] {
  const findings: Finding[] = [];

  for (const [name, value] of Object.entries(responseHeaders)) {
    if (!VERSION_HEADER_NAMES.has(name.toLowerCase())) continue;

    for (const { label, pattern } of VERSION_HEADER_PATTERNS) {
      if (pattern.test(value)) {
        findings.push({
          severity: "warning",
          message: `Version disclosure via "${name}" header: ${label}`,
          details: `Header "${name}: ${value}" reveals server/framework version information`,
        });
        break;
      }
    }
  }

  return findings;
}

export function analyzeResponseBody(body: string): Finding[] {
  return [
    ...scanPatterns(body, STACK_TRACE_PATTERNS, "error"),
    ...scanPatterns(body, FRAMEWORK_BODY_PATTERNS, "warning"),
    ...scanPatterns(body, INTERNAL_PATH_PATTERNS, "warning"),
    ...scanPatterns(body, DB_ERROR_PATTERNS, "error"),
    ...scanPatterns(body, DEBUG_PATTERNS, "error"),
  ];
}

export function analyzeErrorResponse(body: string, probeDescription: string): Finding[] {
  const findings = analyzeResponseBody(body);

  return findings.map((f) => ({
    ...f,
    severity: "error" as const,
    message: `${f.message} (triggered by ${probeDescription})`,
  }));
}
