import type { CheckDefinition } from "../types.js";
import { checkStatusCodes } from "./static/check-status-codes.js";
import { checkResponseHeaders } from "./static/check-response-headers.js";
import { checkHttps } from "./static/check-https.js";
import { checkAuthHeaders } from "./static/check-auth-headers.js";
import { checkSensitiveData } from "./static/check-sensitive-data.js";
import { checkSqlInjection } from "./databases/sql-injection/index.js";

export const allChecks: CheckDefinition[] = [
  checkStatusCodes,
  checkResponseHeaders,
  checkHttps,
  checkAuthHeaders,
  checkSensitiveData,
  checkSqlInjection,
];
