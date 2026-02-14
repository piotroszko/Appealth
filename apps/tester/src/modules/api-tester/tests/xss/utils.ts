const FETCH_TIMEOUT_MS = 5_000;

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

export function matchXssReflection(responseBody: string, payload: string): boolean {
  if (responseBody.includes(payload)) return true;

  if (payload.includes("%")) {
    try {
      const decoded = decodeURIComponent(payload);
      if (decoded !== payload && responseBody.includes(decoded)) return true;
    } catch {
      // invalid encoding — skip
    }
  }

  return false;
}

export async function tryFetch(url: string, init: RequestInit): Promise<string | null> {
  try {
    const res = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: "follow",
    });
    return await res.text();
  } catch {
    return null;
  }
}
