import jwt from "jsonwebtoken";
import type { CapturedRequest } from "../../../../types/index.js";
import type { CheckSeverity } from "../../types.js";
import { WEAK_SECRETS } from "./weak-secrets.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface JwtLocation {
  token: string;
  location: string;
}

export interface DecodedJwt {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
}

export interface Finding {
  severity: CheckSeverity;
  message: string;
  details: string;
}

// ---------------------------------------------------------------------------
// Extraction
// ---------------------------------------------------------------------------

const JWT_RE = /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*/g;

function collectTokens(text: string, label: string, out: Map<string, JwtLocation>): void {
  for (const match of text.matchAll(JWT_RE)) {
    const token = match[0];
    if (!out.has(token)) {
      out.set(token, { token, location: label });
    }
  }
}

/** Scan every location in a captured request/response for JWT-shaped strings. */
export function extractJwts(request: CapturedRequest): JwtLocation[] {
  const seen = new Map<string, JwtLocation>();

  // Authorization header
  const authHeader =
    request.requestHeaders["authorization"] ?? request.requestHeaders["Authorization"];
  if (authHeader) {
    collectTokens(authHeader, "Authorization header", seen);
  }

  // All request headers
  for (const [name, value] of Object.entries(request.requestHeaders)) {
    if (name.toLowerCase() === "authorization") continue;
    if (name.toLowerCase() === "cookie") {
      collectTokens(value, `Cookie header`, seen);
    } else {
      collectTokens(value, `request header "${name}"`, seen);
    }
  }

  // Response headers
  if (request.responseHeaders) {
    for (const [name, value] of Object.entries(request.responseHeaders)) {
      collectTokens(value, `response header "${name}"`, seen);
    }
  }

  // Query parameters
  for (const [name, value] of Object.entries(request.queryParams)) {
    collectTokens(value, `query parameter "${name}"`, seen);
  }

  // POST body
  if (request.postData) {
    collectTokens(request.postData, "request body", seen);
  }

  // Response body
  if (request.responseBody) {
    collectTokens(request.responseBody, "response body", seen);
  }

  return [...seen.values()];
}

// ---------------------------------------------------------------------------
// Decoding
// ---------------------------------------------------------------------------

/** Decode a JWT without verifying the signature. Returns null if invalid. */
export function decodeJwt(token: string): DecodedJwt | null {
  try {
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || typeof decoded === "string") return null;

    return {
      header: decoded.header as unknown as Record<string, unknown>,
      payload:
        typeof decoded.payload === "string"
          ? { raw: decoded.payload }
          : (decoded.payload as unknown as Record<string, unknown>),
      signature: decoded.signature,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Claim analysis
// ---------------------------------------------------------------------------

export function analyzeJwtClaims(decoded: DecodedJwt): Finding[] {
  const findings: Finding[] = [];
  const { payload } = decoded;
  const now = Math.floor(Date.now() / 1000);

  // Missing exp
  if (payload.exp == null) {
    findings.push({
      severity: "warning",
      message: "JWT has no expiration claim",
      details: "Tokens without an `exp` claim never expire and remain valid indefinitely.",
    });
  } else {
    const exp = Number(payload.exp);

    // Expired token (still accepted by server)
    if (exp < now) {
      findings.push({
        severity: "warning",
        message: "JWT is expired",
        details: `Token expired at ${new Date(exp * 1000).toISOString()} but was still present in traffic — the server may not validate expiration.`,
      });
    }

    // Excessive lifetime
    if (payload.iat != null) {
      const iat = Number(payload.iat);
      const lifetimeDays = (exp - iat) / 86400;
      if (lifetimeDays > 30) {
        findings.push({
          severity: "warning",
          message: `JWT has excessive lifetime (${Math.round(lifetimeDays)} days)`,
          details:
            "Long-lived tokens increase the window of opportunity if a token is compromised.",
        });
      }
    }
  }

  // Missing iat
  if (payload.iat == null) {
    findings.push({
      severity: "warning",
      message: "JWT has no issued-at claim",
      details: "Without `iat`, it is impossible to determine token age or detect replay.",
    });
  }

  // nbf in the future
  if (payload.nbf != null) {
    const nbf = Number(payload.nbf);
    if (nbf > now) {
      findings.push({
        severity: "warning",
        message: "JWT not-before is in the future but was accepted",
        details: `Token should not be valid until ${new Date(nbf * 1000).toISOString()} yet the server accepted it.`,
      });
    }
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Header analysis
// ---------------------------------------------------------------------------

const NONE_VARIANTS = new Set(["none", "None", "NONE", "nOnE"]);
const DANGEROUS_HEADER_KEYS = new Set(["jwk", "jku", "x5c", "x5u"]);
const PATH_TRAVERSAL_RE = /(?:\.\.\/|\.\.\\|\/dev\/null|\/etc\/)/;

export function analyzeJwtHeader(decoded: DecodedJwt): Finding[] {
  const findings: Finding[] = [];
  const { header } = decoded;
  const alg = String(header.alg ?? "");

  // alg: none
  if (NONE_VARIANTS.has(alg)) {
    findings.push({
      severity: "error",
      message: `JWT uses '${alg}' algorithm — signature not verified`,
      details:
        "Any party can forge tokens when the algorithm is set to 'none'. The server must reject unsigned tokens.",
    });
  }

  // Embedded JWK
  if (header.jwk != null) {
    findings.push({
      severity: "error",
      message: "JWT header contains embedded JWK — potential key injection",
      details:
        "An attacker can supply their own key via the `jwk` header parameter and sign tokens with it.",
    });
  }

  // Confused algorithm: HMAC + external key reference
  if (/^HS/i.test(alg)) {
    for (const key of DANGEROUS_HEADER_KEYS) {
      if (key !== "jwk" && header[key] != null) {
        findings.push({
          severity: "warning",
          message: `JWT uses HMAC algorithm with '${key}' header — possible algorithm confusion`,
          details: `The '${key}' header is typically used with asymmetric algorithms, not HMAC. This may indicate an algorithm confusion vulnerability.`,
        });
      }
    }
  }

  // kid path traversal
  if (typeof header.kid === "string" && PATH_TRAVERSAL_RE.test(header.kid)) {
    findings.push({
      severity: "warning",
      message: "JWT 'kid' header contains path traversal pattern",
      details: `kid value "${header.kid}" may allow an attacker to reference arbitrary files as the signing key.`,
    });
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Weak secret cracking
// ---------------------------------------------------------------------------

/** Try common weak secrets against an HMAC-signed JWT. Returns the cracked secret or null. */
export function tryWeakSecrets(token: string, algorithm: string): string | null {
  for (const secret of WEAK_SECRETS) {
    try {
      jwt.verify(token, secret, { algorithms: [algorithm as jwt.Algorithm] });
      return secret;
    } catch {
      // Verification failed — try next secret
    }
  }
  return null;
}
