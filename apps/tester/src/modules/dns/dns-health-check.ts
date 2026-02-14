import { checkRecords } from "./checks/records.js";
import { checkEmailSecurity } from "./checks/email-security.js";
import { checkDnssec } from "./checks/dnssec.js";
import { checkNameserverHealth } from "./checks/nameserver-health.js";
import { checkReverseDns } from "./checks/reverse-dns.js";
import { checkMisconfigurations } from "./checks/misconfigurations.js";
import { checkResponseQuality } from "./checks/response-quality.js";
import type { DnsHealthCheckResult, DnsHealthSummary, CheckFinding } from "./types.js";

function computeSummary(allFindings: CheckFinding[]): DnsHealthSummary {
  const summary: DnsHealthSummary = { pass: 0, warn: 0, fail: 0, info: 0, total: 0 };
  for (const f of allFindings) {
    summary[f.status]++;
    summary.total++;
  }
  return summary;
}

export async function runDnsHealthCheck(domain: string): Promise<DnsHealthCheckResult> {
  const start = performance.now();

  // Phase 1: Core records (other checks depend on this)
  const records = await checkRecords(domain);

  // Phase 2: Independent checks in parallel
  const [emailSecurity, dnssec, nameserverHealth, reverseDns, responseQuality] =
    await Promise.allSettled([
      checkEmailSecurity(domain),
      checkDnssec(domain),
      checkNameserverHealth(domain, records.ns),
      checkReverseDns(records.a),
      checkResponseQuality(domain),
    ]);

  const emailSecurityResult =
    emailSecurity.status === "fulfilled"
      ? emailSecurity.value
      : {
          spf: { raw: null, mechanisms: [], dnsLookupCount: 0, hasAll: false, allQualifier: null },
          dmarc: {
            raw: null,
            policy: null,
            subdomainPolicy: null,
            adkim: null,
            aspf: null,
            rua: null,
            ruf: null,
          },
          dkim: { foundSelectors: [], checkedSelectors: [] },
          findings: [],
        };

  const dnssecResult =
    dnssec.status === "fulfilled"
      ? dnssec.value
      : { enabled: false, hasRrsig: false, adFlag: false, findings: [] };

  const nameserverHealthResult =
    nameserverHealth.status === "fulfilled"
      ? nameserverHealth.value
      : {
          probes: [],
          soaSerialsConsistent: false,
          delegationConsistent: null,
          parentNs: [],
          authoritativeNs: [],
          findings: [],
        };

  const reverseDnsResult =
    reverseDns.status === "fulfilled" ? reverseDns.value : { entries: [], findings: [] };

  const responseQualityResult =
    responseQuality.status === "fulfilled"
      ? responseQuality.value
      : { resolutionTimeMs: 0, ttls: [], findings: [] };

  // Phase 3: Misconfigurations (needs CNAME + NS data)
  const misconfigurations = await checkMisconfigurations(domain, records.cname, records.ns).catch(
    () => ({
      danglingCnames: [],
      openResolvers: [],
      axfrExposed: [],
      findings: [] as CheckFinding[],
    }),
  );

  // Aggregate all findings
  const allFindings = [
    ...records.findings,
    ...emailSecurityResult.findings,
    ...dnssecResult.findings,
    ...nameserverHealthResult.findings,
    ...reverseDnsResult.findings,
    ...misconfigurations.findings,
    ...responseQualityResult.findings,
  ];

  const durationMs = Math.round(performance.now() - start);

  return {
    domain,
    timestamp: new Date().toISOString(),
    records,
    emailSecurity: emailSecurityResult,
    dnssec: dnssecResult,
    nameserverHealth: nameserverHealthResult,
    reverseDns: reverseDnsResult,
    misconfigurations,
    responseQuality: responseQualityResult,
    summary: computeSummary(allFindings),
    durationMs,
  };
}
