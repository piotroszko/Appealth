import type { CheckResult } from "../../types.js";

export const EVIL_ORIGIN = "https://evil.com";
export const NULL_ORIGIN = "null";

interface CorsHeaders {
  acao: string | null;
  acac: boolean;
}

export function extractCorsHeaders(headers: Headers): CorsHeaders {
  const acao = headers.get("access-control-allow-origin");
  const acac = headers.get("access-control-allow-credentials") === "true";
  return { acao, acac };
}

export function analyzeCorsResponse(
  probeOrigin: string,
  corsHeaders: CorsHeaders,
  base: { checkName: string; request: { url: string; method: string } },
  baseUrl: string,
): CheckResult | null {
  const { acao, acac } = corsHeaders;
  if (!acao) return null;

  if (acao === probeOrigin && probeOrigin === EVIL_ORIGIN) {
    return {
      ...base,
      severity: "error",
      message: acac ? "Arbitrary origin reflected with credentials" : "Arbitrary origin reflected",
      details: acac
        ? `${baseUrl} reflects Origin: ${EVIL_ORIGIN} in Access-Control-Allow-Origin and sets Access-Control-Allow-Credentials: true, allowing any website to read authenticated responses`
        : `${baseUrl} reflects Origin: ${EVIL_ORIGIN} in Access-Control-Allow-Origin, allowing any website to read responses cross-origin`,
    };
  }

  if (acao === "null" && probeOrigin === NULL_ORIGIN) {
    return {
      ...base,
      severity: "error",
      message: acac ? "Null origin allowed with credentials" : "Null origin allowed",
      details: acac
        ? `${baseUrl} allows Origin: null with Access-Control-Allow-Credentials: true, exploitable via sandboxed iframes`
        : `${baseUrl} allows Origin: null in Access-Control-Allow-Origin, exploitable via sandboxed iframes`,
    };
  }

  if (acao === "*") {
    return {
      ...base,
      severity: acac ? "error" : "warning",
      message: acac ? "Wildcard origin with credentials" : "Wildcard Access-Control-Allow-Origin",
      details: acac
        ? `${baseUrl} returns Access-Control-Allow-Origin: * with Access-Control-Allow-Credentials: true (browsers block this combination, but it signals misconfiguration)`
        : `${baseUrl} returns Access-Control-Allow-Origin: *, allowing any website to read responses cross-origin (no credentials)`,
    };
  }

  return null;
}
