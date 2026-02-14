import { NOSQL_ERROR_PATTERNS } from "./payloads.js";

export function matchNoSqlError(body: string): { engine: string; pattern: RegExp } | undefined {
  return NOSQL_ERROR_PATTERNS.find(({ pattern }) => pattern.test(body));
}
