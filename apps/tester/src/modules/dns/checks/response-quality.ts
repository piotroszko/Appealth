import { Resolver } from "node:dns/promises";
import type { ResponseQualityResult, TtlEntry, CheckFinding } from "../types.js";

const resolver = new Resolver();
resolver.setServers(["8.8.8.8", "1.1.1.1"]);

export async function checkResponseQuality(domain: string): Promise<ResponseQualityResult> {
  const findings: CheckFinding[] = [];
  const ttls: TtlEntry[] = [];

  // Measure resolution time
  const start = performance.now();
  try {
    await resolver.resolve4(domain);
  } catch {
    // Timing still counts even on error
  }
  const resolutionTimeMs = Math.round(performance.now() - start);

  if (resolutionTimeMs < 100) {
    findings.push({
      check: "Resolution time",
      status: "pass",
      message: `DNS resolution took ${resolutionTimeMs}ms`,
    });
  } else if (resolutionTimeMs < 500) {
    findings.push({
      check: "Resolution time",
      status: "warn",
      message: `DNS resolution took ${resolutionTimeMs}ms (>100ms)`,
    });
  } else {
    findings.push({
      check: "Resolution time",
      status: "fail",
      message: `DNS resolution took ${resolutionTimeMs}ms (>500ms)`,
    });
  }

  // TTL audit
  const ttlChecks = await Promise.allSettled([
    resolver.resolve4(domain, { ttl: true }).then((records) => {
      for (const r of records) {
        ttls.push({ type: "A", value: r.address, ttl: r.ttl });
      }
      return { type: "A" as const, records };
    }),
    resolver.resolve6(domain, { ttl: true }).then((records) => {
      for (const r of records) {
        ttls.push({ type: "AAAA", value: r.address, ttl: r.ttl });
      }
      return { type: "AAAA" as const, records };
    }),
  ]);

  // Check A/AAAA TTLs
  for (const result of ttlChecks) {
    if (result.status !== "fulfilled") continue;
    const { type, records } = result.value;
    for (const r of records) {
      if (r.ttl < 60) {
        findings.push({
          check: `${type} TTL`,
          status: "warn",
          message: `${type} record ${r.address} has low TTL (${r.ttl}s < 60s) — may cause excessive queries`,
        });
      } else {
        findings.push({
          check: `${type} TTL`,
          status: "pass",
          message: `${type} record ${r.address} TTL is ${r.ttl}s`,
        });
      }
    }
  }

  // Check NS TTLs
  try {
    // NS records don't support { ttl: true } in node:dns, so we use a workaround:
    // resolve NS and report as info
    const nsRecords = await resolver.resolveNs(domain);
    if (nsRecords.length > 0) {
      findings.push({
        check: "NS TTL",
        status: "info",
        message: `${nsRecords.length} NS record(s) found (NS TTL not directly available via node:dns)`,
      });
    }
  } catch {
    // NS TTL check is best-effort
  }

  return { resolutionTimeMs, ttls, findings };
}
