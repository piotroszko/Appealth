import type { CheckSeverity } from "../../types.js";
import type { InfoLeakPattern, PiiPattern } from "./patterns.js";
import {
  SENSITIVE_KEYS,
  STACK_TRACE_PATTERNS,
  VERSION_HEADER_NAMES,
  VERSION_HEADER_PATTERNS,
  FRAMEWORK_BODY_PATTERNS,
  INTERNAL_PATH_PATTERNS,
  DB_ERROR_PATTERNS,
  DEBUG_PATTERNS,
  PII_PATTERNS,
  API_KEY_PATTERNS,
  SOURCE_MAP_COMMENT_PATTERN,
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

// ── Luhn check ─────────────────────────────────────────────────────

function luhnCheck(raw: string): boolean {
  const digits = raw.replace(/[\s-]/g, "");
  if (!/^\d{13,19}$/.test(digits)) return false;

  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

// ── PII detection ──────────────────────────────────────────────────

function scanPiiPatterns(body: string, patterns: PiiPattern[]): Finding[] {
  const seen = new Set<string>();
  const findings: Finding[] = [];

  for (const { label, pattern, luhn } of patterns) {
    if (seen.has(label)) continue;

    const match = pattern.exec(body);
    if (!match) continue;

    // For credit cards, validate with Luhn before reporting
    if (luhn) {
      if (!luhnCheck(match[0])) continue;
    }

    seen.add(label);
    findings.push({
      severity: "error",
      message: `PII detected: ${label} found in response body`,
      details: `Matched value (redacted): ${redact(match[0])}`,
    });
  }

  return findings;
}

function redact(value: string): string {
  if (value.length <= 6) return "***";
  return value.slice(0, 3) + "***" + value.slice(-3);
}

export function detectPii(body: string): Finding[] {
  return [
    ...scanPiiPatterns(body, PII_PATTERNS),
    ...scanPatterns(body, API_KEY_PATTERNS, "error"),
  ];
}

// ── Source-map detection ───────────────────────────────────────────

export function detectSourceMapComment(body: string): { url: string } | null {
  const match = SOURCE_MAP_COMMENT_PATTERN.exec(body);
  if (!match?.[1]) return null;
  return { url: match[1] };
}
