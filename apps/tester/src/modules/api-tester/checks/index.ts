import type { BaseCheck } from "./base-check.js";
import { StatusCodesCheck } from "./static/status-codes-check.js";
import { ResponseHeadersCheck } from "./static/response-headers-check.js";
import { HttpsCheck } from "./static/https-check.js";
import { AuthHeadersCheck } from "./static/auth-headers-check.js";
import { CookieSecurityCheck } from "./cookies/cookie-security-check.js";
import { SensitiveDataCheck } from "./sensitive-data/sensitive-data-check.js";
import { SqlInjectionCheck } from "./sql-injection/sql-injection-check.js";
import { XssCheck } from "./xss/xss-check.js";
import { DomXssCheck } from "./xss/dom-xss-check.js";
import { CommandInjectionCheck } from "./command-injection/command-injection-check.js";
import { SsrfCheck } from "./ssrf/ssrf-check.js";
import { NoSqlInjectionCheck } from "./nosql-injection/nosql-injection-check.js";
import { PredefinedUrlsCheck } from "./predefined-urls/predefined-urls-check.js";
import { CorsCheck } from "./cors/cors-check.js";
import { OpenRedirectCheck } from "./open-redirect/open-redirect-check.js";
import { HttpMethodTamperingCheck } from "./http-method-tampering/http-method-tampering-check.js";
import { JwtCheck } from "./jwt/jwt-check.js";
import { SstiCheck } from "./ssti/ssti-check.js";

const BASIC_CHECKS = [
  StatusCodesCheck,
  ResponseHeadersCheck,
  HttpsCheck,
  AuthHeadersCheck,
  CookieSecurityCheck,
  DomXssCheck,
  JwtCheck,
] as const;

const FULL_ONLY_CHECKS = [
  CorsCheck,
  HttpMethodTamperingCheck,
  SensitiveDataCheck,
  SqlInjectionCheck,
  XssCheck,
  CommandInjectionCheck,
  SsrfCheck,
  NoSqlInjectionCheck,
  PredefinedUrlsCheck,
  OpenRedirectCheck,
  SstiCheck,
] as const;

export function createChecks(mode: "basic" | "full" = "full"): BaseCheck[] {
  const checks: BaseCheck[] = BASIC_CHECKS.map((Check) => new Check());
  if (mode === "full") {
    checks.push(...FULL_ONLY_CHECKS.map((Check) => new Check()));
  }
  return checks;
}
