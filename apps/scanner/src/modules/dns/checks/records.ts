import { Resolver } from "node:dns/promises";
import type { RecordsResult, SoaRecord, MxRecord, CaaRecord, CheckFinding } from "../types.js";

const resolver = new Resolver();
resolver.setServers(["8.8.8.8", "1.1.1.1"]);

export async function checkRecords(domain: string): Promise<RecordsResult> {
  const [a, aaaa, ns, soa, mx, txtRaw, cname, caa] = await Promise.allSettled([
    resolver.resolve4(domain),
    resolver.resolve6(domain),
    resolver.resolveNs(domain),
    resolver.resolveSoa(domain),
    resolver.resolveMx(domain),
    resolver.resolveTxt(domain),
    resolver.resolveCname(domain),
    resolver.resolveCaa(domain),
  ]);

  const aRecords = a.status === "fulfilled" ? a.value : [];
  const aaaaRecords = aaaa.status === "fulfilled" ? aaaa.value : [];
  const nsRecords = ns.status === "fulfilled" ? ns.value : [];
  const soaRecord = soa.status === "fulfilled" ? (soa.value as SoaRecord) : null;
  const mxRecords = mx.status === "fulfilled" ? (mx.value as MxRecord[]) : [];
  const txtRecords =
    txtRaw.status === "fulfilled" ? txtRaw.value.map((chunks) => chunks.join("")) : [];
  const cnameRecords =
    cname.status === "fulfilled" ? (Array.isArray(cname.value) ? cname.value : [cname.value]) : [];
  const caaRecords = caa.status === "fulfilled" ? (caa.value as CaaRecord[]) : [];

  const findings: CheckFinding[] = [];

  // Critical records
  if (aRecords.length > 0) {
    findings.push({
      check: "A record",
      status: "pass",
      message: `Found ${aRecords.length} A record(s)`,
      details: { records: aRecords },
    });
  } else {
    findings.push({ check: "A record", status: "fail", message: "No A records found" });
  }

  if (nsRecords.length > 0) {
    findings.push({
      check: "NS record",
      status: "pass",
      message: `Found ${nsRecords.length} nameserver(s)`,
      details: { records: nsRecords },
    });
  } else {
    findings.push({ check: "NS record", status: "fail", message: "No NS records found" });
  }

  if (soaRecord) {
    findings.push({
      check: "SOA record",
      status: "pass",
      message: `SOA present (serial: ${soaRecord.serial})`,
    });
  } else {
    findings.push({ check: "SOA record", status: "fail", message: "No SOA record found" });
  }

  // Optional records
  if (aaaaRecords.length > 0) {
    findings.push({
      check: "AAAA record",
      status: "pass",
      message: `Found ${aaaaRecords.length} AAAA record(s)`,
    });
  } else {
    findings.push({
      check: "AAAA record",
      status: "info",
      message: "No AAAA (IPv6) records found",
    });
  }

  if (mxRecords.length > 0) {
    findings.push({
      check: "MX record",
      status: "pass",
      message: `Found ${mxRecords.length} MX record(s)`,
    });
  } else {
    findings.push({
      check: "MX record",
      status: "info",
      message: "No MX records found — domain does not receive email",
    });
  }

  if (caaRecords.length > 0) {
    findings.push({
      check: "CAA record",
      status: "pass",
      message: `Found ${caaRecords.length} CAA record(s)`,
    });
  } else {
    findings.push({
      check: "CAA record",
      status: "info",
      message: "No CAA records — any CA can issue certificates",
    });
  }

  if (cnameRecords.length > 0) {
    findings.push({
      check: "CNAME record",
      status: "info",
      message: `Found CNAME: ${cnameRecords.join(", ")}`,
    });
  }

  if (txtRecords.length > 0) {
    findings.push({
      check: "TXT record",
      status: "info",
      message: `Found ${txtRecords.length} TXT record(s)`,
    });
  }

  return {
    a: aRecords,
    aaaa: aaaaRecords,
    ns: nsRecords,
    soa: soaRecord,
    mx: mxRecords,
    txt: txtRecords,
    cname: cnameRecords,
    caa: caaRecords,
    findings,
  };
}
