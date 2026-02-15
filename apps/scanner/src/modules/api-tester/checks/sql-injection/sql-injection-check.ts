import type { InjectionConfig } from "../injection-check.js";
import { InjectionCheck } from "../injection-check.js";
import { SQL_PAYLOADS } from "./payloads.js";
import { matchSqlError } from "./utils.js";

export class SqlInjectionCheck extends InjectionCheck {
  readonly name = "sql-injection";
  readonly description =
    "Attempts SQL injection on query params, body fields, URL path, and headers, flags responses that resemble SQL errors";

  protected readonly config: InjectionConfig = {
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
}
