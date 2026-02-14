import { throttledFetch } from "../../../worker/fetch-wrapper.js";
import { SQL_ERROR_PATTERNS } from "./payloads.js";

export function parseBodyFields(
  postData: string,
  contentType: string | undefined,
): Record<string, string> | null {
  if (!postData) return null;

  if (contentType?.includes("application/json")) {
    try {
      const parsed = JSON.parse(postData);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        const fields: Record<string, string> = {};
        for (const [key, value] of Object.entries(parsed)) {
          if (typeof value === "string" || typeof value === "number") {
            fields[key] = String(value);
          }
        }
        return Object.keys(fields).length > 0 ? fields : null;
      }
    } catch {
      return null;
    }
  }

  if (!contentType || contentType.includes("application/x-www-form-urlencoded")) {
    try {
      const params = new URLSearchParams(postData);
      const fields: Record<string, string> = {};
      for (const [key, value] of params.entries()) {
        fields[key] = value;
      }
      return Object.keys(fields).length > 0 ? fields : null;
    } catch {
      return null;
    }
  }

  return null;
}

export function matchSqlError(body: string): { engine: string; pattern: RegExp } | undefined {
  return SQL_ERROR_PATTERNS.find(({ pattern }) => pattern.test(body));
}

export async function tryFetch(url: string, init: RequestInit): Promise<string | null> {
  try {
    const res = await throttledFetch(url, init);
    return await res.text();
  } catch {
    return null;
  }
}
