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
