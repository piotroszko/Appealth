import type { CheckDefinition } from "../../../types.js";
import { isAllowedDomain } from "../../../utils.js";
import type { InjectionConfig } from "../../utils.js";
import {
  parseBodyFields,
  testQueryParams,
  testBodyFields,
  testUrlPath,
  testHeaders,
} from "../../utils.js";
import { SQL_PAYLOADS } from "./payloads.js";
import { matchSqlError } from "./utils.js";

const sqlConfig: InjectionConfig = {
  payloads: SQL_PAYLOADS,
  vulnLabel: "SQL injection",
  match(body) {
    const m = matchSqlError(body);
    if (!m) return null;
    return {
      suffix: ` (${m.engine})`,
      explanation: `triggered ${m.engine} error pattern: ${m.pattern}`,
    };
  },
};

export const checkSqlInjection: CheckDefinition = {
  name: "sql-injection",
  description:
    "Attempts SQL injection on query params, body fields, URL path, and headers, flags responses that resemble SQL errors",
  async fn(request, options) {
    const { url, method, requestHeaders, queryParams, postData } = request;

    if (!isAllowedDomain(url, options.domains)) {
      return [];
    }

    const base = { checkName: "sql-injection", request: { url, method } };

    const hasQueryParams = Object.keys(queryParams).length > 0;
    const contentType = Object.entries(requestHeaders).find(
      ([k]) => k.toLowerCase() === "content-type",
    )?.[1];
    const bodyFields = postData ? parseBodyFields(postData, contentType) : null;

    const results = await Promise.all([
      testUrlPath(request, base, sqlConfig),
      hasQueryParams ? testQueryParams(request, base, sqlConfig) : [],
      bodyFields ? testBodyFields(request, bodyFields, contentType, base, sqlConfig) : [],
      testHeaders(request, base, sqlConfig),
    ]);

    return results.flat();
  },
};
