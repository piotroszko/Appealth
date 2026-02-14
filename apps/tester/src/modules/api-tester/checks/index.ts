import type { BaseCheck } from "./base-check.js";
import { StatusCodesCheck } from "./static/status-codes-check.js";
import { ResponseHeadersCheck } from "./static/response-headers-check.js";
import { HttpsCheck } from "./static/https-check.js";
import { AuthHeadersCheck } from "./static/auth-headers-check.js";
import { SensitiveDataCheck } from "./static/sensitive-data-check.js";
import { SqlInjectionCheck } from "./sql-injection/sql-injection-check.js";
import { XssCheck } from "./xss/xss-check.js";
import { CommandInjectionCheck } from "./command-injection/command-injection-check.js";
import { SsrfCheck } from "./ssrf/ssrf-check.js";
import { NoSqlInjectionCheck } from "./nosql-injection/nosql-injection-check.js";
import { PredefinedUrlsCheck } from "./predefined-urls/predefined-urls-check.js";
import { CorsCheck } from "./cors/cors-check.js";
import { OpenRedirectCheck } from "./open-redirect/open-redirect-check.js";

export function createChecks(): BaseCheck[] {
  return [
    new StatusCodesCheck(),
    new ResponseHeadersCheck(),
    new HttpsCheck(),
    new AuthHeadersCheck(),
    new SensitiveDataCheck(),
    new SqlInjectionCheck(),
    new XssCheck(),
    new CommandInjectionCheck(),
    new SsrfCheck(),
    new NoSqlInjectionCheck(),
    new PredefinedUrlsCheck(),
    new CorsCheck(),
    new OpenRedirectCheck(),
  ];
}
