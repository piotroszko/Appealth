import type { CapturedRequest } from "../../../types/index.js";
import type { CheckContext, CheckResult } from "../types.js";
import type { HttpClient } from "../http-client.js";
import { isAllowedDomain } from "../utils.js";
import { BaseCheck } from "./base-check.js";
import { INJECTABLE_HEADERS, parseBodyFields } from "./injection-utils.js";

export interface InjectionConfig {
  payloads: string[];
  match(body: string, payload: string): { suffix: string; explanation: string } | null;
  vulnLabel: string;
  replaceValue?: boolean;
  skipUrlPath?: boolean;
}

export abstract class InjectionCheck extends BaseCheck {
  protected abstract readonly config: InjectionConfig;

  async run(request: CapturedRequest, context: CheckContext): Promise<CheckResult[]> {
    const { url, requestHeaders, queryParams, postData } = request;

    if (!isAllowedDomain(url, context.options.domains)) {
      return [];
    }

    const base = this.base(request);
    const { httpClient } = context;

    const hasQueryParams = Object.keys(queryParams).length > 0;
    const contentType = Object.entries(requestHeaders).find(
      ([k]) => k.toLowerCase() === "content-type",
    )?.[1];
    const bodyFields = postData ? parseBodyFields(postData, contentType) : null;

    const results = await Promise.all([
      this.config.skipUrlPath ? [] : this.testUrlPath(request, base, httpClient),
      hasQueryParams ? this.testQueryParams(request, base, httpClient) : [],
      bodyFields ? this.testBodyFields(request, bodyFields, contentType, base, httpClient) : [],
      this.testHeaders(request, base, httpClient),
    ]);

    return results.flat();
  }

  private async testQueryParams(
    request: CapturedRequest,
    base: { checkName: string; request: { url: string; method: string } },
    httpClient: HttpClient,
  ): Promise<CheckResult[]> {
    const results: CheckResult[] = [];
    const parsed = new URL(request.url);

    for (const [param, originalValue] of Object.entries(request.queryParams)) {
      for (const payload of this.config.payloads) {
        const injectedUrl = new URL(parsed.toString());
        injectedUrl.searchParams.set(
          param,
          this.config.replaceValue ? payload : originalValue + payload,
        );

        const body = await httpClient.tryFetch(injectedUrl.toString(), {
          method: request.method,
          headers: { ...request.requestHeaders },
        });

        if (!body) continue;

        const match = this.config.match(body, payload);
        if (match) {
          results.push({
            ...base,
            severity: "error",
            message: `Possible ${this.config.vulnLabel} via query param "${param}"${match.suffix}`,
            details: `Payload "${payload}" in param "${param}" ${match.explanation}`,
          });
          break;
        }
      }
    }

    return results;
  }

  private async testHeaders(
    request: CapturedRequest,
    base: { checkName: string; request: { url: string; method: string } },
    httpClient: HttpClient,
  ): Promise<CheckResult[]> {
    const results: CheckResult[] = [];

    const headersToTest = Object.entries(request.requestHeaders).filter(([k]) =>
      INJECTABLE_HEADERS.has(k.toLowerCase()),
    );

    for (const [header, originalValue] of headersToTest) {
      for (const payload of this.config.payloads) {
        const injectedHeaders = {
          ...request.requestHeaders,
          [header]: this.config.replaceValue ? payload : originalValue + payload,
        };

        const body = await httpClient.tryFetch(request.url, {
          method: request.method,
          headers: injectedHeaders,
        });

        if (!body) continue;

        const match = this.config.match(body, payload);
        if (match) {
          results.push({
            ...base,
            severity: "error",
            message: `Possible ${this.config.vulnLabel} via header "${header}"${match.suffix}`,
            details: `Payload "${payload}" in header "${header}" ${match.explanation}`,
          });
          break;
        }
      }
    }

    return results;
  }

  private async testUrlPath(
    request: CapturedRequest,
    base: { checkName: string; request: { url: string; method: string } },
    httpClient: HttpClient,
  ): Promise<CheckResult[]> {
    const results: CheckResult[] = [];
    const parsed = new URL(request.url);
    const basePath = parsed.pathname.endsWith("/") ? parsed.pathname : `${parsed.pathname}/`;

    for (const payload of this.config.payloads) {
      const injectedUrl = new URL(parsed.toString());
      injectedUrl.pathname = basePath + encodeURIComponent(payload);

      const body = await httpClient.tryFetch(injectedUrl.toString(), {
        method: request.method,
        headers: { ...request.requestHeaders },
      });

      if (!body) continue;

      const match = this.config.match(body, payload);
      if (match) {
        results.push({
          ...base,
          severity: "error",
          message: `Possible ${this.config.vulnLabel} via URL path${match.suffix}`,
          details: `Payload "${payload}" appended to path ${match.explanation}`,
        });
        break;
      }
    }

    return results;
  }

  private async testBodyFields(
    request: CapturedRequest,
    fields: Record<string, string>,
    contentType: string | undefined,
    base: { checkName: string; request: { url: string; method: string } },
    httpClient: HttpClient,
  ): Promise<CheckResult[]> {
    const results: CheckResult[] = [];
    const isJson = contentType?.includes("application/json");

    for (const [field, originalValue] of Object.entries(fields)) {
      for (const payload of this.config.payloads) {
        const injectedValue = this.config.replaceValue ? payload : originalValue + payload;
        let injectedBody: string;
        let bodyContentType: string;

        if (isJson) {
          const original = JSON.parse(request.postData!);
          original[field] = injectedValue;
          injectedBody = JSON.stringify(original);
          bodyContentType = "application/json";
        } else {
          const params = new URLSearchParams(request.postData!);
          params.set(field, injectedValue);
          injectedBody = params.toString();
          bodyContentType = "application/x-www-form-urlencoded";
        }

        const headers = { ...request.requestHeaders, "content-type": bodyContentType };
        const body = await httpClient.tryFetch(request.url, {
          method: request.method,
          headers,
          body: injectedBody,
        });

        if (!body) continue;

        const match = this.config.match(body, payload);
        if (match) {
          results.push({
            ...base,
            severity: "error",
            message: `Possible ${this.config.vulnLabel} via body field "${field}"${match.suffix}`,
            details: `Payload "${payload}" in field "${field}" ${match.explanation}`,
          });
          break;
        }
      }
    }

    return results;
  }
}
