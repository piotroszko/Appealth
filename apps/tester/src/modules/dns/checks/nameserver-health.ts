import { Resolver } from "node:dns/promises";
import type { NameserverHealthResult, NsProbeResult, CheckFinding } from "../types.js";

const resolver = new Resolver();
resolver.setServers(["8.8.8.8", "1.1.1.1"]);

async function probeNameserver(ns: string, domain: string): Promise<NsProbeResult> {
  let ip: string | null = null;
  try {
    const ips = await resolver.resolve4(ns);
    ip = ips[0] ?? null;
  } catch {
    return { nameserver: ns, ip: null, responsive: false, responseTimeMs: null, soaSerial: null, error: "Could not resolve NS IP" };
  }

  if (!ip) {
    return { nameserver: ns, ip: null, responsive: false, responseTimeMs: null, soaSerial: null, error: "No A record for NS" };
  }

  const nsResolver = new Resolver();
  nsResolver.setServers([ip]);

  const start = performance.now();
  try {
    const soa = await nsResolver.resolveSoa(domain);
    const responseTimeMs = Math.round(performance.now() - start);
    return { nameserver: ns, ip, responsive: true, responseTimeMs, soaSerial: soa.serial };
  } catch (err) {
    const responseTimeMs = Math.round(performance.now() - start);
    return {
      nameserver: ns,
      ip,
      responsive: false,
      responseTimeMs,
      soaSerial: null,
      error: err instanceof Error ? err.message : "SOA query failed",
    };
  }
}

function getParentZone(domain: string): string | null {
  const parts = domain.split(".");
  if (parts.length < 2) return null;
  return parts.slice(1).join(".");
}

async function checkDelegation(domain: string, authoritativeNs: string[]): Promise<{ consistent: boolean | null; parentNs: string[]; findings: CheckFinding[] }> {
  const findings: CheckFinding[] = [];
  const parent = getParentZone(domain);

  if (!parent) {
    return { consistent: null, parentNs: [], findings };
  }

  try {
    // Get parent zone nameservers
    const parentNsRecords = await resolver.resolveNs(parent);
    if (parentNsRecords.length === 0) {
      return { consistent: null, parentNs: [], findings };
    }

    // Query one parent NS for the domain's NS records
    const parentIps = await resolver.resolve4(parentNsRecords[0]!);
    if (parentIps.length === 0) {
      return { consistent: null, parentNs: [], findings };
    }

    const parentResolver = new Resolver();
    parentResolver.setServers([parentIps[0]!]);

    let delegatedNs: string[];
    try {
      delegatedNs = await parentResolver.resolveNs(domain);
    } catch {
      // Parent might not delegate directly — that's ok
      return { consistent: null, parentNs: parentNsRecords, findings };
    }

    const authSet = new Set(authoritativeNs.map((n) => n.toLowerCase().replace(/\.$/, "")));
    const delegatedSet = new Set(delegatedNs.map((n) => n.toLowerCase().replace(/\.$/, "")));

    const authArr = [...authSet].sort();
    const delegatedArr = [...delegatedSet].sort();
    const consistent = authArr.join(",") === delegatedArr.join(",");

    if (consistent) {
      findings.push({ check: "NS delegation", status: "pass", message: "Delegation matches authoritative NS records" });
    } else {
      findings.push({
        check: "NS delegation",
        status: "warn",
        message: "Delegation NS mismatch with authoritative NS",
        details: { authoritative: authArr, delegated: delegatedArr },
      });
    }

    return { consistent, parentNs: parentNsRecords, findings };
  } catch {
    return { consistent: null, parentNs: [], findings };
  }
}

export async function checkNameserverHealth(domain: string, nsRecords: string[]): Promise<NameserverHealthResult> {
  const findings: CheckFinding[] = [];

  if (nsRecords.length === 0) {
    findings.push({ check: "Nameserver health", status: "fail", message: "No NS records to check" });
    return {
      probes: [],
      soaSerialsConsistent: false,
      delegationConsistent: null,
      parentNs: [],
      authoritativeNs: nsRecords,
      findings,
    };
  }

  // Probe all nameservers in parallel
  const probeResults = await Promise.allSettled(nsRecords.map((ns) => probeNameserver(ns, domain)));
  const probes: NsProbeResult[] = [];

  for (const result of probeResults) {
    if (result.status === "fulfilled") {
      probes.push(result.value);
    }
  }

  // Check availability
  const responsive = probes.filter((p) => p.responsive);
  const unresponsive = probes.filter((p) => !p.responsive);

  if (responsive.length === probes.length) {
    findings.push({ check: "NS availability", status: "pass", message: `All ${probes.length} nameserver(s) are responsive` });
  } else if (responsive.length > 0) {
    findings.push({
      check: "NS availability",
      status: "warn",
      message: `${unresponsive.length} of ${probes.length} nameserver(s) unresponsive: ${unresponsive.map((p) => p.nameserver).join(", ")}`,
    });
  } else {
    findings.push({ check: "NS availability", status: "fail", message: "No nameservers are responsive" });
  }

  // Check response times
  for (const probe of responsive) {
    if (probe.responseTimeMs !== null) {
      const status = probe.responseTimeMs < 100 ? "pass" : probe.responseTimeMs < 500 ? "warn" : "fail";
      findings.push({
        check: "NS response time",
        status,
        message: `${probe.nameserver} (${probe.ip}) responded in ${probe.responseTimeMs}ms`,
      });
    }
  }

  // SOA serial consistency
  const serials = responsive.filter((p) => p.soaSerial !== null).map((p) => p.soaSerial!);
  const uniqueSerials = new Set(serials);
  const soaSerialsConsistent = uniqueSerials.size <= 1;

  if (serials.length >= 2) {
    if (soaSerialsConsistent) {
      findings.push({ check: "SOA serial consistency", status: "pass", message: `All nameservers report SOA serial ${serials[0]}` });
    } else {
      findings.push({
        check: "SOA serial consistency",
        status: "warn",
        message: `SOA serials diverge across nameservers: ${[...uniqueSerials].join(", ")}`,
      });
    }
  }

  // Delegation consistency
  const delegation = await checkDelegation(domain, nsRecords);
  findings.push(...delegation.findings);

  return {
    probes,
    soaSerialsConsistent,
    delegationConsistent: delegation.consistent,
    parentNs: delegation.parentNs,
    authoritativeNs: nsRecords,
    findings,
  };
}
