import { Resolver } from "node:dns/promises";
import type { ReverseDnsResult, ReverseDnsEntry, CheckFinding } from "../types.js";

const resolver = new Resolver();
resolver.setServers(["8.8.8.8", "1.1.1.1"]);

async function checkIpReverse(ip: string): Promise<ReverseDnsEntry> {
  let ptrHostnames: string[] = [];
  try {
    ptrHostnames = await resolver.reverse(ip);
  } catch {
    return { ip, ptrHostnames: [], forwardConfirmed: false };
  }

  // Forward-confirm: resolve each PTR hostname back and check if original IP is in the results
  let forwardConfirmed = false;
  for (const hostname of ptrHostnames) {
    try {
      const addresses = await resolver.resolve4(hostname);
      if (addresses.includes(ip)) {
        forwardConfirmed = true;
        break;
      }
    } catch {
      // Forward lookup failed, try next
    }
  }

  return { ip, ptrHostnames, forwardConfirmed };
}

export async function checkReverseDns(aRecords: string[]): Promise<ReverseDnsResult> {
  const findings: CheckFinding[] = [];

  if (aRecords.length === 0) {
    findings.push({
      check: "Reverse DNS",
      status: "info",
      message: "No A records to check reverse DNS",
    });
    return { entries: [], findings };
  }

  const results = await Promise.allSettled(aRecords.map((ip) => checkIpReverse(ip)));
  const entries: ReverseDnsEntry[] = [];

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    const entry = result.value;
    entries.push(entry);

    if (entry.ptrHostnames.length === 0) {
      findings.push({
        check: "Reverse DNS",
        status: "info",
        message: `No PTR record for ${entry.ip}`,
      });
    } else if (entry.forwardConfirmed) {
      findings.push({
        check: "Reverse DNS",
        status: "pass",
        message: `FCrDNS confirmed for ${entry.ip} → ${entry.ptrHostnames.join(", ")}`,
      });
    } else {
      findings.push({
        check: "Reverse DNS",
        status: "warn",
        message: `PTR exists for ${entry.ip} (${entry.ptrHostnames.join(", ")}) but forward lookup doesn't confirm`,
      });
    }
  }

  return { entries, findings };
}
