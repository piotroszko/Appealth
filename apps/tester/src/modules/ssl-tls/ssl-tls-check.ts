import { checkCertificate } from "./checks/certificate.js";
import { checkProtocols } from "./checks/protocol.js";
import { checkCipher } from "./checks/cipher.js";
import { checkHsts } from "./checks/hsts.js";
import { checkCaaValidation } from "./checks/caa-validation.js";
import type { SslTlsCheckResult, SslTlsSummary, CheckFinding } from "./types.js";

function computeSummary(allFindings: CheckFinding[]): SslTlsSummary {
  const summary: SslTlsSummary = { pass: 0, warn: 0, fail: 0, info: 0, total: 0 };
  for (const f of allFindings) {
    summary[f.status]++;
    summary.total++;
  }
  return summary;
}

export async function runSslTlsCheck(hostname: string, port = 443): Promise<SslTlsCheckResult> {
  const start = performance.now();

  // Phase 1: Certificate check (issuer data feeds CAA validation)
  const certificateResult = await checkCertificate(hostname, port);

  // Extract issuer org for CAA validation
  const issuerOrg = certificateResult.certificate?.issuer?.O ?? null;

  // Phase 2: Independent checks in parallel
  const [protocol, cipher, hsts, caaValidation] = await Promise.allSettled([
    checkProtocols(hostname, port),
    checkCipher(hostname, port),
    checkHsts(hostname),
    checkCaaValidation(hostname, issuerOrg),
  ]);

  const protocolResult = protocol.status === "fulfilled"
    ? protocol.value
    : { protocols: [], negotiatedProtocol: null, findings: [] };

  const cipherResult = cipher.status === "fulfilled"
    ? cipher.value
    : { negotiatedCipher: null, findings: [] };

  const hstsResult = hsts.status === "fulfilled"
    ? hsts.value
    : { present: false, maxAge: null, includeSubDomains: false, preload: false, rawHeader: null, findings: [] };

  const caaValidationResult = caaValidation.status === "fulfilled"
    ? caaValidation.value
    : { caaRecords: [], certificateIssuer: null, issuerMatchesCaa: null, findings: [] };

  // Aggregate all findings
  const allFindings = [
    ...certificateResult.findings,
    ...protocolResult.findings,
    ...cipherResult.findings,
    ...hstsResult.findings,
    ...caaValidationResult.findings,
  ];

  const durationMs = Math.round(performance.now() - start);

  return {
    domain: hostname,
    port,
    timestamp: new Date().toISOString(),
    certificate: certificateResult,
    protocol: protocolResult,
    cipher: cipherResult,
    hsts: hstsResult,
    caaValidation: caaValidationResult,
    summary: computeSummary(allFindings),
    durationMs,
  };
}
