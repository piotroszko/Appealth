import type { CapturedRequest } from "../../../../types/index.js";
import type { CheckContext, CheckResult } from "../../types.js";
import { isAllowedDomain } from "../../utils.js";
import { parseBodyFields } from "../injection-utils.js";
import { BaseCheck } from "../base-check.js";
import { EVIL_DOMAIN, makePayloads } from "./payloads.js";
import { getLocationHeader, isRedirectParam, isUrlLikeValue } from "./utils.js";

interface CandidateParam {
  source: "query" | "body";
  name: string;
}

export class OpenRedirectCheck extends BaseCheck {
  readonly name = "open-redirect";
  readonly description =
    "Injects external URLs into redirect-like params to detect open redirect vulnerabilities via 3xx Location header";

  async run(request: CapturedRequest, context: CheckContext): Promise<CheckResult[]> {
    const { url, queryParams, postData, requestHeaders } = request;

    if (!isAllowedDomain(url, context.options.domains)) {
      return [];
    }

    let targetHost: string;
    try {
      targetHost = new URL(url).hostname;
    } catch {
      return [];
    }

    const base = this.base(request);
    const payloads = makePayloads(targetHost);

    const candidates: CandidateParam[] = [];

    for (const [name, value] of Object.entries(queryParams)) {
      if (isRedirectParam(name) || isUrlLikeValue(value)) {
        candidates.push({ source: "query", name });
      }
    }

    const contentType = Object.entries(requestHeaders).find(
      ([k]) => k.toLowerCase() === "content-type",
    )?.[1];
    const bodyFields = postData ? parseBodyFields(postData, contentType) : null;

    if (bodyFields) {
      for (const [name, value] of Object.entries(bodyFields)) {
        if (isRedirectParam(name) || isUrlLikeValue(value)) {
          candidates.push({ source: "body", name });
        }
      }
    }

    if (candidates.length === 0) return [];

    const results: CheckResult[] = [];

    for (const candidate of candidates) {
      for (const payload of payloads) {
        const found = await this.probe(
          request,
          candidate,
          payload,
          bodyFields,
          contentType,
          context,
        );
        if (found) {
          results.push({
            ...base,
            severity: "error",
            message: `Open redirect via ${candidate.source} param "${candidate.name}"`,
            details: `Payload "${payload}" in ${candidate.source} param "${candidate.name}" caused a redirect to ${EVIL_DOMAIN}`,
          });
          break;
        }
      }
    }

    return results;
  }

  private async probe(
    request: CapturedRequest,
    candidate: CandidateParam,
    payload: string,
    bodyFields: Record<string, string> | null,
    contentType: string | undefined,
    context: CheckContext,
  ): Promise<boolean> {
    try {
      let fetchUrl = request.url;
      let body: string | undefined;
      const headers = { ...request.requestHeaders };

      if (candidate.source === "query") {
        const parsed = new URL(request.url);
        parsed.searchParams.set(candidate.name, payload);
        fetchUrl = parsed.toString();
      } else if (bodyFields) {
        const isJson = contentType?.includes("application/json");
        if (isJson) {
          const original = JSON.parse(request.postData!);
          original[candidate.name] = payload;
          body = JSON.stringify(original);
          headers["content-type"] = "application/json";
        } else {
          const params = new URLSearchParams(request.postData!);
          params.set(candidate.name, payload);
          body = params.toString();
          headers["content-type"] = "application/x-www-form-urlencoded";
        }
      }

      const res = await context.httpClient.fetch(fetchUrl, {
        method: request.method,
        headers,
        body,
        redirect: "manual",
      });

      await res.text();

      if (res.status < 300 || res.status > 308) return false;

      const location = getLocationHeader(res.headers);
      if (!location) return false;

      return location.toLowerCase().includes(EVIL_DOMAIN);
    } catch {
      return false;
    }
  }
}
