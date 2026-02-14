import { REDIRECT_PARAM_NAMES } from "./payloads.js";

export function isRedirectParam(name: string): boolean {
  return REDIRECT_PARAM_NAMES.has(name.toLowerCase());
}

export function isUrlLikeValue(value: string): boolean {
  const v = value.trimStart();
  return v.startsWith("http://") || v.startsWith("https://") || v.startsWith("//");
}

export function getLocationHeader(headers: Headers): string | null {
  return headers.get("location");
}
