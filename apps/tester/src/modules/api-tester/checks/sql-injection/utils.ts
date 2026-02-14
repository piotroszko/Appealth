import { SQL_ERROR_PATTERNS } from "./payloads.js";

export function matchSqlError(body: string): { engine: string; pattern: RegExp } | undefined {
  return SQL_ERROR_PATTERNS.find(({ pattern }) => pattern.test(body));
}
