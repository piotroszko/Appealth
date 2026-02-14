import tls from "node:tls";
import type { ProtocolResult, ProtocolSupport, CheckFinding } from "../types.js";

type TlsVersion = "TLSv1" | "TLSv1.1" | "TLSv1.2" | "TLSv1.3";

const PROTOCOLS: { version: TlsVersion; label: string; deprecated: boolean }[] = [
  { version: "TLSv1", label: "TLS 1.0", deprecated: true },
  { version: "TLSv1.1", label: "TLS 1.1", deprecated: true },
  { version: "TLSv1.2", label: "TLS 1.2", deprecated: false },
  { version: "TLSv1.3", label: "TLS 1.3", deprecated: false },
];

function testProtocol(hostname: string, port: number, version: TlsVersion): Promise<boolean | null> {
  return new Promise((resolve) => {
    const socket = tls.connect(
      {
        host: hostname,
        port,
        servername: hostname,
        rejectUnauthorized: false,
        minVersion: version,
        maxVersion: version,
        timeout: 8_000,
      },
      () => {
        socket.destroy();
        resolve(true);
      },
    );

    socket.on("error", (err) => {
      const msg = err.message.toLowerCase();
      // Node/OpenSSL may refuse to use TLS 1.0/1.1 client-side
      if (msg.includes("unsupported protocol") || msg.includes("no protocols available") || msg.includes("version too low")) {
        resolve(null); // inconclusive
      } else {
        resolve(false);
      }
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

function getNegotiatedProtocol(hostname: string, port: number): Promise<string | null> {
  return new Promise((resolve) => {
    const socket = tls.connect(
      { host: hostname, port, servername: hostname, rejectUnauthorized: false, timeout: 8_000 },
      () => {
        const proto = socket.getProtocol();
        socket.destroy();
        resolve(proto);
      },
    );

    socket.on("error", () => resolve(null));
    socket.on("timeout", () => { socket.destroy(); resolve(null); });
  });
}

export async function checkProtocols(hostname: string, port: number): Promise<ProtocolResult> {
  const findings: CheckFinding[] = [];

  const [results, negotiatedProtocol] = await Promise.all([
    Promise.allSettled(PROTOCOLS.map((p) => testProtocol(hostname, port, p.version))),
    getNegotiatedProtocol(hostname, port),
  ]);

  const protocols: ProtocolSupport[] = PROTOCOLS.map((p, i) => {
    const result = results[i]!;
    const supported = result.status === "fulfilled" ? result.value : false;
    return {
      protocol: p.label,
      supported: supported === true,
      deprecated: p.deprecated,
    };
  });

  // Generate findings
  for (let i = 0; i < PROTOCOLS.length; i++) {
    const p = PROTOCOLS[i]!;
    const result = results[i]!;
    const supported = result.status === "fulfilled" ? result.value : false;

    if (supported === null) {
      findings.push({ check: p.label, status: "info", message: `${p.label} support inconclusive (client-side restriction)` });
      continue;
    }

    switch (p.version) {
      case "TLSv1":
        findings.push(supported
          ? { check: p.label, status: "fail", message: "TLS 1.0 is supported (insecure, should be disabled)" }
          : { check: p.label, status: "pass", message: "TLS 1.0 is not supported" });
        break;
      case "TLSv1.1":
        findings.push(supported
          ? { check: p.label, status: "warn", message: "TLS 1.1 is supported (deprecated, should be disabled)" }
          : { check: p.label, status: "pass", message: "TLS 1.1 is not supported" });
        break;
      case "TLSv1.2":
        findings.push(supported
          ? { check: p.label, status: "pass", message: "TLS 1.2 is supported" }
          : { check: p.label, status: "fail", message: "TLS 1.2 is not supported (required for compatibility)" });
        break;
      case "TLSv1.3":
        findings.push(supported
          ? { check: p.label, status: "pass", message: "TLS 1.3 is supported" }
          : { check: p.label, status: "warn", message: "TLS 1.3 is not supported (recommended)" });
        break;
    }
  }

  return { protocols, negotiatedProtocol, findings };
}
