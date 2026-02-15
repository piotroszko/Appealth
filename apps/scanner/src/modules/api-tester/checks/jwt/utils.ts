import crypto from "node:crypto";
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

  // jku — JWK Set URL (attacker can host own key set)
  if (header.jku != null) {
    findings.push({
      severity: "error",
      message: "JWT header contains jku (JWK Set URL) — potential key injection",
      details:
        `The 'jku' header points to "${header.jku}". An attacker can supply their own URL hosting ` +
        `a crafted JWK Set to have the server verify tokens with an attacker-controlled key.`,
    });
  }

  // x5u — X.509 URL (attacker can host own certificate)
  if (header.x5u != null) {
    findings.push({
      severity: "error",
      message: "JWT header contains x5u (X.509 URL) — potential key injection",
      details:
        `The 'x5u' header points to "${header.x5u}". An attacker can supply their own URL hosting ` +
        `a crafted X.509 certificate to have the server verify tokens with an attacker-controlled key.`,
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

// ---------------------------------------------------------------------------
// Algorithm confusion (RSA → HMAC)
// ---------------------------------------------------------------------------

/**
 * Extract a PEM public key from an x5c certificate chain header.
 * Returns null if extraction fails.
 */
function extractPublicKeyFromX5c(x5c: unknown[]): string | null {
  try {
    const cert = String(x5c[0]);
    const pemCert = `-----BEGIN CERTIFICATE-----\n${cert}\n-----END CERTIFICATE-----`;
    const publicKey = crypto.createPublicKey(pemCert);
    return publicKey.export({ type: "spki", format: "pem" }) as string;
  } catch {
    return null;
  }
}

/**
 * Check for algorithm confusion attacks on asymmetric-algorithm JWTs.
 *
 * If the token uses RS256 (or another RSA/EC algorithm) and the public key
 * is available (e.g. via the x5c header), this attempts to re-sign the
 * token using HS256 with the public key as the HMAC secret — the classic
 * algorithm confusion / key confusion attack.
 */
export function checkAlgorithmConfusion(_token: string, decoded: DecodedJwt): Finding[] {
  const findings: Finding[] = [];
  const { header } = decoded;
  const alg = String(header.alg ?? "");

  // Only applies to asymmetric algorithms
  if (!/^(?:RS|PS|ES)\d/i.test(alg)) return findings;

  // Try to extract public key from x5c header
  if (Array.isArray(header.x5c) && header.x5c.length > 0) {
    const publicKeyPem = extractPublicKeyFromX5c(header.x5c);

    if (publicKeyPem) {
      try {
        // Re-sign the token payload as HS256 using the public key as HMAC secret
        const forgedToken = jwt.sign(decoded.payload as object, publicKeyPem, {
          algorithm: "HS256" as jwt.Algorithm,
        });

        if (forgedToken) {
          findings.push({
            severity: "error",
            message: `Algorithm confusion: ${alg} token re-signed as HS256 using public key from x5c`,
            details:
              `The original ${alg} token was successfully re-signed using HS256 with the public key ` +
              `extracted from the embedded x5c certificate chain. If the server does not strictly ` +
              `enforce the expected algorithm, this forged token would be accepted — allowing ` +
              `arbitrary token forgery.`,
          });
        }
      } catch {
        // Re-signing failed — still flag the potential
        findings.push({
          severity: "warning",
          message: `JWT uses ${alg} with embedded x5c — potential algorithm confusion target`,
          details:
            `The token contains an x5c certificate chain from which a public key could be extracted. ` +
            `An attacker could attempt to re-sign the token using HS256 with that public key as ` +
            `the HMAC secret.`,
        });
      }
    }
  } else {
    // No embedded key material, but RSA tokens are still potential targets
    findings.push({
      severity: "warning",
      message: `JWT uses asymmetric algorithm (${alg}) — verify algorithm confusion protections`,
      details:
        `Ensure the server strictly enforces the expected algorithm and does not accept HS256 ` +
        `tokens verified with the RSA/EC public key. If the server's public key is known (e.g. ` +
        `via a JWKS endpoint), an attacker could re-sign tokens as HS256 using that key.`,
    });
  }

  return findings;
}
