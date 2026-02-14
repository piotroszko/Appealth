import { Resolver } from "node:dns/promises";
import net from "node:net";
import dnsPacket from "dns-packet";
import type { MisconfigurationResult, CheckFinding } from "../types.js";

const resolver = new Resolver();
resolver.setServers(["8.8.8.8", "1.1.1.1"]);

async function checkDanglingCnames(cnameRecords: string[]): Promise<{ dangling: { cname: string; target: string }[]; findings: CheckFinding[] }> {
  const findings: CheckFinding[] = [];
  const dangling: { cname: string; target: string }[] = [];

  for (const target of cnameRecords) {
    try {
      await resolver.resolve4(target);
      // Resolves fine — not dangling
    } catch (err) {
      if (err instanceof Error && "code" in err && (err as NodeJS.ErrnoException).code === "ENOTFOUND") {
        dangling.push({ cname: target, target });
        findings.push({ check: "Dangling CNAME", status: "fail", message: `CNAME target ${target} resolves to NXDOMAIN` });
      }
    }
  }

  if (cnameRecords.length > 0 && dangling.length === 0) {
    findings.push({ check: "Dangling CNAME", status: "pass", message: "No dangling CNAME records detected" });
  }

  return { dangling, findings };
}

async function resolveNsIps(nsRecords: string[]): Promise<{ nameserver: string; ip: string }[]> {
  const results: { nameserver: string; ip: string }[] = [];
  const resolved = await Promise.allSettled(
    nsRecords.map(async (ns) => {
      const ips = await resolver.resolve4(ns);
      return { nameserver: ns, ip: ips[0]! };
    }),
  );
  for (const r of resolved) {
    if (r.status === "fulfilled") {
      results.push(r.value);
    }
  }
  return results;
}

async function checkOpenResolvers(nsRecords: string[]): Promise<{ open: { nameserver: string; ip: string }[]; findings: CheckFinding[] }> {
  const findings: CheckFinding[] = [];
  const open: { nameserver: string; ip: string }[] = [];
  const nsWithIps = await resolveNsIps(nsRecords);

  const checks = await Promise.allSettled(
    nsWithIps.map(async ({ nameserver, ip }) => {
      const testResolver = new Resolver();
      testResolver.setServers([ip]);
      try {
        await testResolver.resolve4("example.com");
        // If it resolves an unrelated domain, it's an open resolver
        return { nameserver, ip, isOpen: true };
      } catch {
        return { nameserver, ip, isOpen: false };
      }
    }),
  );

  for (const result of checks) {
    if (result.status !== "fulfilled") continue;
    if (result.value.isOpen) {
      open.push({ nameserver: result.value.nameserver, ip: result.value.ip });
      findings.push({
        check: "Open resolver",
        status: "warn",
        message: `${result.value.nameserver} (${result.value.ip}) acts as an open resolver`,
      });
    }
  }

  if (nsWithIps.length > 0 && open.length === 0) {
    findings.push({ check: "Open resolver", status: "pass", message: "No nameservers acting as open resolvers" });
  }

  return { open, findings };
}

function attemptAxfr(ip: string, domain: string, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timer = setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, timeoutMs);

    socket.on("error", () => {
      clearTimeout(timer);
      socket.destroy();
      resolve(false);
    });

    socket.connect(53, ip, () => {
      const query: dnsPacket.Packet = {
        type: "query",
        id: Math.floor(Math.random() * 65535),
        flags: 0,
        questions: [{ type: "AXFR", name: domain }],
      };

      const encoded = dnsPacket.streamEncode(query);
      socket.write(encoded);
    });

    let received = Buffer.alloc(0);
    socket.on("data", (chunk) => {
      received = Buffer.concat([received, chunk]);
      clearTimeout(timer);
      socket.destroy();
      // If we got any data back, try to decode it
      try {
        if (received.length > 2) {
          const response = dnsPacket.streamDecode(received);
          const answers = response.answers ?? [];
          // If we got actual records back (not just an error), AXFR is exposed
          resolve(answers.length > 0);
        } else {
          resolve(false);
        }
      } catch {
        resolve(false);
      }
    });

    socket.on("close", () => {
      clearTimeout(timer);
      resolve(false);
    });
  });
}

async function checkAxfrExposure(nsRecords: string[], domain: string): Promise<{ exposed: { nameserver: string; ip: string }[]; findings: CheckFinding[] }> {
  const findings: CheckFinding[] = [];
  const exposed: { nameserver: string; ip: string }[] = [];
  const nsWithIps = await resolveNsIps(nsRecords);

  const checks = await Promise.allSettled(
    nsWithIps.map(async ({ nameserver, ip }) => {
      const isExposed = await attemptAxfr(ip, domain, 5000);
      return { nameserver, ip, isExposed };
    }),
  );

  for (const result of checks) {
    if (result.status !== "fulfilled") continue;
    if (result.value.isExposed) {
      exposed.push({ nameserver: result.value.nameserver, ip: result.value.ip });
      findings.push({
        check: "AXFR exposure",
        status: "fail",
        message: `${result.value.nameserver} (${result.value.ip}) allows zone transfer (AXFR)`,
      });
    }
  }

  if (nsWithIps.length > 0 && exposed.length === 0) {
    findings.push({ check: "AXFR exposure", status: "pass", message: "No nameservers allow zone transfers" });
  }

  return { exposed, findings };
}

export async function checkMisconfigurations(
  domain: string,
  cnameRecords: string[],
  nsRecords: string[],
): Promise<MisconfigurationResult> {
  const [danglingResult, openResolverResult, axfrResult] = await Promise.allSettled([
    checkDanglingCnames(cnameRecords),
    checkOpenResolvers(nsRecords),
    checkAxfrExposure(nsRecords, domain),
  ]);

  const dangling = danglingResult.status === "fulfilled" ? danglingResult.value : { dangling: [], findings: [] };
  const openResolvers = openResolverResult.status === "fulfilled" ? openResolverResult.value : { open: [], findings: [] };
  const axfr = axfrResult.status === "fulfilled" ? axfrResult.value : { exposed: [], findings: [] };

  return {
    danglingCnames: dangling.dangling,
    openResolvers: openResolvers.open,
    axfrExposed: axfr.exposed,
    findings: [...dangling.findings, ...openResolvers.findings, ...axfr.findings],
  };
}
