import { Resolver } from "node:dns/promises";
import type { CaaValidationResult, CheckFinding } from "../types.js";

const resolver = new Resolver();
resolver.setServers(["8.8.8.8", "1.1.1.1"]);

const CA_ORG_TO_CAA: Record<string, string[]> = {
  "let's encrypt": ["letsencrypt.org"],
  "digicert": ["digicert.com", "symantec.com"],
  "comodo": ["comodoca.com", "sectigo.com"],
  "sectigo": ["sectigo.com", "comodoca.com"],
  "globalsign": ["globalsign.com"],
  "godaddy": ["godaddy.com", "starfieldtech.com"],
  "amazon": ["amazon.com", "amazontrust.com"],
  "google": ["pki.goog", "google.com"],
  "cloudflare": ["cloudflaressl.com", "digicert.com", "letsencrypt.org", "pki.goog", "sectigo.com"],
  "microsoft": ["microsoft.com"],
  "entrust": ["entrust.net"],
  "buypass": ["buypass.com"],
  "zerossl": ["sectigo.com", "zerossl.com"],
};

function matchIssuerToCaa(issuerOrg: string, caaIssueDomains: string[]): boolean {
  const orgLower = issuerOrg.toLowerCase();

  for (const [caName, caaDomains] of Object.entries(CA_ORG_TO_CAA)) {
    if (orgLower.includes(caName)) {
      return caaDomains.some((d) => caaIssueDomains.some((caa) => caa.includes(d)));
    }
  }

  // Direct domain match fallback
  return caaIssueDomains.some((caa) => orgLower.includes(caa) || caa.includes(orgLower));
}

export async function checkCaaValidation(hostname: string, issuerOrg: string | null): Promise<CaaValidationResult> {
  const findings: CheckFinding[] = [];

  let caaRecords: string[] = [];
  try {
    const records = await resolver.resolveCaa(hostname);
    caaRecords = records
      .filter((r) => r.issue)
      .map((r) => r.issue!);
  } catch {
    // No CAA records or NXDOMAIN
  }

  if (caaRecords.length === 0) {
    findings.push({
      check: "CAA records",
      status: "info",
      message: "No CAA records found — any CA is allowed to issue certificates",
    });
    return { caaRecords, certificateIssuer: issuerOrg, issuerMatchesCaa: null, findings };
  }

  if (!issuerOrg) {
    findings.push({
      check: "CAA validation",
      status: "info",
      message: "CAA records found but certificate issuer is unknown — cannot validate",
      details: { caaRecords },
    });
    return { caaRecords, certificateIssuer: null, issuerMatchesCaa: null, findings };
  }

  const matches = matchIssuerToCaa(issuerOrg, caaRecords);

  if (matches) {
    findings.push({
      check: "CAA validation",
      status: "pass",
      message: `Certificate issuer "${issuerOrg}" is authorized by CAA records`,
      details: { issuerOrg, caaRecords },
    });
  } else {
    findings.push({
      check: "CAA validation",
      status: "warn",
      message: `Certificate issuer "${issuerOrg}" may not be authorized by CAA records`,
      details: { issuerOrg, caaRecords },
    });
  }

  return { caaRecords, certificateIssuer: issuerOrg, issuerMatchesCaa: matches, findings };
}
