import { AUTH_COOKIE_PATTERNS, SECURITY_FLAGS } from "./patterns.js";
import type { CheckSeverity } from "../../types.js";

export interface ParsedCookie {
  raw: string;
  name: string;
  value: string;
  attributes: Set<string>;
  isAuth: boolean;
}

export interface Finding {
  severity: CheckSeverity;
  message: string;
  details: string;
}

export function extractSetCookieHeaders(responseHeaders: Record<string, string>): string[] {
  const key = Object.keys(responseHeaders).find((k) => k.toLowerCase() === "set-cookie");
  if (!key) return [];

  const value = responseHeaders[key];
  return value ? value.split("\n").filter(Boolean) : [];
}

export function parseCookie(setCookieStr: string): ParsedCookie | null {
  const trimmed = setCookieStr.trim();
  if (!trimmed) return null;

  const semicolonIndex = trimmed.indexOf(";");
  const nameValuePart = semicolonIndex === -1 ? trimmed : trimmed.slice(0, semicolonIndex);

  const equalsIndex = nameValuePart.indexOf("=");
  if (equalsIndex === -1) return null;

  const name = nameValuePart.slice(0, equalsIndex).trim();
  if (!name) return null;

  const value = nameValuePart.slice(equalsIndex + 1).trim();

  const attributes = new Set<string>();
  if (semicolonIndex !== -1) {
    const parts = trimmed.slice(semicolonIndex + 1).split(";");
    for (const part of parts) {
      const attrName = part.split("=")[0]?.trim().toLowerCase();
      if (attrName) attributes.add(attrName);
    }
  }

  return {
    raw: trimmed,
    name,
    value,
    attributes,
    isAuth: isAuthCookie(name),
  };
}

export function isAuthCookie(name: string): boolean {
  return AUTH_COOKIE_PATTERNS.some((pattern) => pattern.test(name));
}

export function analyzeCookie(cookie: ParsedCookie): Finding[] {
  const findings: Finding[] = [];
  const label = cookie.isAuth ? "auth/session" : "non-auth";

  for (const flag of SECURITY_FLAGS) {
    const severity = cookie.isAuth ? flag.authSeverity : flag.nonAuthSeverity;

    if (!severity) continue;

    if (!cookie.attributes.has(flag.attribute)) {
      findings.push({
        severity,
        message: `Cookie "${cookie.name}" (${label}) missing ${flag.name} flag`,
        details: flag.reason,
      });
    }
  }

  // SameSite=None without Secure is a misconfiguration
  if (cookie.attributes.has("samesite")) {
    const raw = cookie.raw.toLowerCase();
    const sameSiteMatch = raw.match(/samesite\s*=\s*(\w+)/);
    if (sameSiteMatch?.[1] === "none" && !cookie.attributes.has("secure")) {
      findings.push({
        severity: cookie.isAuth ? "error" : "warning",
        message: `Cookie "${cookie.name}" (${label}) has SameSite=None without Secure flag`,
        details: "SameSite=None requires the Secure flag; browsers will reject this cookie",
      });
    }
  }

  return findings;
}
