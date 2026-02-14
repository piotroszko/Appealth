import type { CapturedRequest } from "../../../../types/index.js";
import type { CheckContext, CheckResult } from "../../types.js";
import { BaseCheck } from "../base-check.js";
import {
  extractJwts,
  decodeJwt,
  analyzeJwtHeader,
  analyzeJwtClaims,
  tryWeakSecrets,
} from "./utils.js";

export class JwtCheck extends BaseCheck {
  readonly name = "jwt-analysis";
  readonly description =
    "Decodes JWTs from cookies/headers/params, flags alg:none, weak signing, missing expiration, expired tokens";

  private readonly analyzedTokens = new Set<string>();

  async run(request: CapturedRequest, _context: CheckContext): Promise<CheckResult[]> {
    const results: CheckResult[] = [];
    const jwts = extractJwts(request);

    for (const { token, location } of jwts) {
      if (this.analyzedTokens.has(token)) continue;
      this.analyzedTokens.add(token);

      const decoded = decodeJwt(token);
      if (!decoded) continue;

      const base = this.base(request);

      // Header analysis (alg:none, embedded jwk, kid issues)
      for (const finding of analyzeJwtHeader(decoded)) {
        results.push({
          ...base,
          severity: finding.severity,
          message: finding.message,
          details: `Found in ${location}. ${finding.details}`,
        });
      }

      // Claims analysis (exp, iat, nbf, lifetime)
      for (const finding of analyzeJwtClaims(decoded)) {
        results.push({
          ...base,
          severity: finding.severity,
          message: finding.message,
          details: `Found in ${location}. ${finding.details}`,
        });
      }

      // Weak secret cracking (HMAC algorithms only)
      const alg = String(decoded.header.alg ?? "");
      if (/^HS/i.test(alg)) {
        const crackedSecret = tryWeakSecrets(token, alg);
        if (crackedSecret) {
          results.push({
            ...base,
            severity: "error",
            message: `JWT signed with weak/default secret: "${crackedSecret}"`,
            details: `Found in ${location}. The token can be forged by anyone who knows this common secret. Algorithm: ${alg}`,
          });
        }
      }
    }

    return results;
  }
}
