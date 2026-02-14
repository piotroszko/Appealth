import type { CheckDefinition } from "../../types.js";
import { isAllowedDomain } from "../../utils.js";
import type { InjectionConfig } from "../utils.js";
import {
  parseBodyFields,
  testQueryParams,
  testBodyFields,
  testUrlPath,
  testHeaders,
} from "../utils.js";
import { XSS_PAYLOADS } from "./payloads.js";
import { matchXssReflection } from "./utils.js";

const xssConfig: InjectionConfig = {
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

export const checkXss: CheckDefinition = {
  name: "xss",
  description:
    "Attempts reflected XSS on query params, body fields, URL path, and headers, flags responses where payloads are reflected unescaped",
  async fn(request, options) {
    const { url, method, requestHeaders, queryParams, postData } = request;

    if (!isAllowedDomain(url, options.domains)) {
      return [];
    }

    const base = { checkName: "xss", request: { url, method } };

    const hasQueryParams = Object.keys(queryParams).length > 0;
    const contentType = Object.entries(requestHeaders).find(
      ([k]) => k.toLowerCase() === "content-type",
    )?.[1];
    const bodyFields = postData ? parseBodyFields(postData, contentType) : null;

    const results = await Promise.all([
      testUrlPath(request, base, xssConfig),
      hasQueryParams ? testQueryParams(request, base, xssConfig) : [],
      bodyFields ? testBodyFields(request, bodyFields, contentType, base, xssConfig) : [],
      testHeaders(request, base, xssConfig),
    ]);

    return results.flat();
  },
};
