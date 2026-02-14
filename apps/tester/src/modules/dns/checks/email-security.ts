import { Resolver } from "node:dns/promises";
import type { EmailSecurityResult, SpfResult, DmarcResult, DkimResult, CheckFinding } from "../types.js";

const resolver = new Resolver();
resolver.setServers(["8.8.8.8", "1.1.1.1"]);

const DKIM_SELECTORS = [
  "default", "google", "selector1", "selector2",
  "k1", "k2", "dkim", "mail", "s1", "s2",
  "protonmail", "smtp", "mandrill", "amazonses",
  "cm", "mxvault", "zendesk1", "zendesk2",
];

// Mechanisms that trigger DNS lookups per RFC 7208
const DNS_LOOKUP_MECHANISMS = ["include", "a", "mx", "ptr", "exists", "redirect"];

function parseTags(raw: string): Map<string, string> {
  const tags = new Map<string, string>();
  for (const part of raw.split(";")) {
    const trimmed = part.trim();
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      tags.set(trimmed.slice(0, eqIdx).trim(), trimmed.slice(eqIdx + 1).trim());
    }
  }
  return tags;
}

async function resolveTxtRecords(name: string): Promise<string[]> {
  try {
    const records = await resolver.resolveTxt(name);
    return records.map((chunks) => chunks.join(""));
  } catch {
    return [];
  }
}

async function checkSpf(domain: string): Promise<{ spf: SpfResult; findings: CheckFinding[] }> {
  const findings: CheckFinding[] = [];
  const txtRecords = await resolveTxtRecords(domain);
  const spfRecords = txtRecords.filter((r) => r.startsWith("v=spf1"));

  if (spfRecords.length === 0) {
    findings.push({ check: "SPF", status: "warn", message: "No SPF record found" });
    return { spf: { raw: null, mechanisms: [], dnsLookupCount: 0, hasAll: false, allQualifier: null }, findings };
  }

  if (spfRecords.length > 1) {
    findings.push({ check: "SPF", status: "fail", message: `Multiple SPF records found (${spfRecords.length}) — violates RFC 7208` });
  }

  const raw = spfRecords[0]!;
  const mechanisms = raw.split(/\s+/).slice(1); // skip v=spf1

  // Count DNS lookups
  let dnsLookupCount = 0;
  for (const mech of mechanisms) {
    const mechName = mech.replace(/^[+\-~?]/, "").split(":")[0]!.split("/")[0]!;
    if (DNS_LOOKUP_MECHANISMS.includes(mechName)) {
      dnsLookupCount++;
    }
  }

  if (dnsLookupCount > 10) {
    findings.push({ check: "SPF lookup count", status: "warn", message: `SPF uses ${dnsLookupCount} DNS lookups (max 10 per RFC 7208)` });
  } else {
    findings.push({ check: "SPF lookup count", status: "pass", message: `SPF uses ${dnsLookupCount} DNS lookup(s) (max 10)` });
  }

  // Check all mechanism
  const allMech = mechanisms.find((m) => m.endsWith("all") || m === "all");
  const hasAll = !!allMech;
  let allQualifier: string | null = null;
  if (allMech) {
    allQualifier = allMech[0] === "+" || allMech[0] === "-" || allMech[0] === "~" || allMech[0] === "?" ? allMech[0] : "+";
    if (allQualifier === "-") {
      findings.push({ check: "SPF all qualifier", status: "pass", message: "SPF uses -all (hard fail)" });
    } else if (allQualifier === "~") {
      findings.push({ check: "SPF all qualifier", status: "pass", message: "SPF uses ~all (soft fail)" });
    } else {
      findings.push({ check: "SPF all qualifier", status: "warn", message: `SPF uses ${allQualifier}all — should be ~all or -all` });
    }
  } else {
    findings.push({ check: "SPF all qualifier", status: "warn", message: "SPF record has no terminal 'all' mechanism" });
  }

  // Check for deprecated ptr
  if (mechanisms.some((m) => m.replace(/^[+\-~?]/, "").startsWith("ptr"))) {
    findings.push({ check: "SPF ptr mechanism", status: "warn", message: "SPF uses deprecated 'ptr' mechanism (RFC 7208 §5.5)" });
  }

  if (spfRecords.length === 1) {
    findings.push({ check: "SPF", status: "pass", message: "Valid SPF record found" });
  }

  return { spf: { raw, mechanisms, dnsLookupCount, hasAll, allQualifier }, findings };
}

async function checkDmarc(domain: string): Promise<{ dmarc: DmarcResult; findings: CheckFinding[] }> {
  const findings: CheckFinding[] = [];
  const txtRecords = await resolveTxtRecords(`_dmarc.${domain}`);
  const dmarcRecords = txtRecords.filter((r) => r.startsWith("v=DMARC1"));

  if (dmarcRecords.length === 0) {
    findings.push({ check: "DMARC", status: "warn", message: "No DMARC record found" });
    return { dmarc: { raw: null, policy: null, subdomainPolicy: null, adkim: null, aspf: null, rua: null, ruf: null }, findings };
  }

  const raw = dmarcRecords[0]!;
  const tags = parseTags(raw);

  const policy = tags.get("p") ?? null;
  const subdomainPolicy = tags.get("sp") ?? null;
  const adkim = tags.get("adkim") ?? null;
  const aspf = tags.get("aspf") ?? null;
  const rua = tags.get("rua") ?? null;
  const ruf = tags.get("ruf") ?? null;

  if (policy === "none") {
    findings.push({ check: "DMARC policy", status: "warn", message: "DMARC policy is 'none' — no enforcement" });
  } else if (policy === "quarantine" || policy === "reject") {
    findings.push({ check: "DMARC policy", status: "pass", message: `DMARC policy is '${policy}'` });
  }

  if (rua) {
    findings.push({ check: "DMARC reporting", status: "pass", message: `DMARC aggregate reporting configured: ${rua}` });
  } else {
    findings.push({ check: "DMARC reporting", status: "info", message: "No DMARC aggregate reporting (rua) configured" });
  }

  findings.push({ check: "DMARC", status: "pass", message: "DMARC record found" });

  return { dmarc: { raw, policy, subdomainPolicy, adkim, aspf, rua, ruf }, findings };
}

async function checkDkim(domain: string): Promise<{ dkim: DkimResult; findings: CheckFinding[] }> {
  const findings: CheckFinding[] = [];
  const foundSelectors: string[] = [];

  const results = await Promise.allSettled(
    DKIM_SELECTORS.map(async (selector) => {
      const records = await resolveTxtRecords(`${selector}._domainkey.${domain}`);
      // Require v=DKIM1 tag or both k= and p= tags to avoid false positives from wildcard DNS
      if (records.some((r) => r.includes("v=DKIM1") || (r.includes("k=") && r.includes("p=")))) {
        return selector;
      }
      return null;
    }),
  );

  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      foundSelectors.push(result.value);
    }
  }

  if (foundSelectors.length > 0) {
    findings.push({
      check: "DKIM",
      status: "pass",
      message: `Found DKIM selector(s): ${foundSelectors.join(", ")}`,
      details: { selectors: foundSelectors },
    });
  } else {
    findings.push({ check: "DKIM", status: "info", message: "No DKIM selectors found among common selectors" });
  }

  return { dkim: { foundSelectors, checkedSelectors: [...DKIM_SELECTORS] }, findings };
}

export async function checkEmailSecurity(domain: string): Promise<EmailSecurityResult> {
  const [spfResult, dmarcResult, dkimResult] = await Promise.all([
    checkSpf(domain),
    checkDmarc(domain),
    checkDkim(domain),
  ]);

  return {
    spf: spfResult.spf,
    dmarc: dmarcResult.dmarc,
    dkim: dkimResult.dkim,
    findings: [...spfResult.findings, ...dmarcResult.findings, ...dkimResult.findings],
  };
}
