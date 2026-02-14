import type { CapturedRequest } from "../../../../types/index.js";
import type { CheckContext, CheckResult } from "../../types.js";
import type { HttpClient } from "../../http-client.js";
import { isAllowedDomain } from "../../utils.js";
import type { InjectionConfig } from "../injection-check.js";
import { InjectionCheck } from "../injection-check.js";
import { NOSQL_OPERATOR_PAYLOADS, NOSQL_PAYLOADS } from "./payloads.js";
import { matchNoSqlError } from "./utils.js";

const BRACKET_OPERATORS = ["$ne", "$gt", "$gte", "$regex", "$exists"];

export class NoSqlInjectionCheck extends InjectionCheck {
  readonly name = "nosql-injection";
  readonly description =
    "Attempts NoSQL injection (MongoDB, Redis, DynamoDB, Elasticsearch) on query params, body fields, URL path, and headers";

  protected readonly config: InjectionConfig = {
    payloads: NOSQL_PAYLOADS,
    vulnLabel: "NoSQL injection",
    replaceValue: true,
    match(body) {
      const m = matchNoSqlError(body);
      if (!m) return null;
      return {
        suffix: ` (${m.engine})`,
        explanation: `triggered ${m.engine} error pattern: ${m.pattern}`,
      };
    },
  };

  async run(request: CapturedRequest, context: CheckContext): Promise<CheckResult[]> {
    const results = await super.run(request, context);

    if (!isAllowedDomain(request.url, context.options.domains)) return results;

    const base = this.base(request);
    const { httpClient } = context;

    const [operatorResults, bracketResults] = await Promise.all([
      this.testOperatorInjection(request, base, httpClient),
      this.testBracketNotation(request, base, httpClient),
    ]);

    return [...results, ...operatorResults, ...bracketResults];
  }

  private async testOperatorInjection(
    request: CapturedRequest,
    base: { checkName: string; request: { url: string; method: string } },
    httpClient: HttpClient,
  ): Promise<CheckResult[]> {
    if (!request.postData) return [];

    const contentType = Object.entries(request.requestHeaders).find(
      ([k]) => k.toLowerCase() === "content-type",
    )?.[1];

    if (!contentType?.includes("application/json")) return [];

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(request.postData);
    } catch {
      return [];
    }

    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return [];

    const results: CheckResult[] = [];
    const stringFields = Object.entries(parsed).filter(([, v]) => typeof v === "string");

    for (const [field] of stringFields) {
      for (const operator of NOSQL_OPERATOR_PAYLOADS) {
        const injected = { ...parsed, [field]: operator.value };
        const injectedBody = JSON.stringify(injected);

        const body = await httpClient.tryFetch(request.url, {
          method: request.method,
          headers: { ...request.requestHeaders, "content-type": "application/json" },
          body: injectedBody,
        });

        if (!body) continue;

        const m = matchNoSqlError(body);
        if (m) {
          results.push({
            ...base,
            severity: "error",
            message: `Possible NoSQL injection via body field "${field}" (${m.engine})`,
            details: `Operator ${operator.label} in field "${field}" triggered ${m.engine} error pattern: ${m.pattern}`,
          });
          break;
        }
      }
    }

    return results;
  }

  private async testBracketNotation(
    request: CapturedRequest,
    base: { checkName: string; request: { url: string; method: string } },
    httpClient: HttpClient,
  ): Promise<CheckResult[]> {
    const queryParams = request.queryParams;
    if (Object.keys(queryParams).length === 0) return [];

    const results: CheckResult[] = [];
    const parsed = new URL(request.url);

    for (const param of Object.keys(queryParams)) {
      for (const op of BRACKET_OPERATORS) {
        const injectedUrl = new URL(parsed.toString());
        injectedUrl.searchParams.set(`${param}[${op}]`, "");

        const body = await httpClient.tryFetch(injectedUrl.toString(), {
          method: request.method,
          headers: { ...request.requestHeaders },
        });

        if (!body) continue;

        const m = matchNoSqlError(body);
        if (m) {
          results.push({
            ...base,
            severity: "error",
            message: `Possible NoSQL injection via bracket notation "${param}[${op}]" (${m.engine})`,
            details: `Bracket operator ${param}[${op}]= triggered ${m.engine} error pattern: ${m.pattern}`,
          });
          break;
        }
      }
    }

    return results;
  }
}
