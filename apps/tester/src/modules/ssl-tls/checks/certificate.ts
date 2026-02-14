import tls from "node:tls";
import type { CertificateResult, CertificateInfo, ChainCertificate, CheckFinding } from "../types.js";

export async function checkCertificate(hostname: string, port: number): Promise<CertificateResult> {
  const findings: CheckFinding[] = [];

  return new Promise((resolve) => {
    const socket = tls.connect(
      { host: hostname, port, servername: hostname, rejectUnauthorized: false, timeout: 10_000 },
      () => {
        try {
          const peerCert = socket.getPeerCertificate(true);

          if (!peerCert || !peerCert.subject) {
            findings.push({ check: "Certificate", status: "fail", message: "No certificate returned by server" });
            socket.destroy();
            resolve({ certificate: null, chain: [], chainValid: false, chainLength: 0, findings });
            return;
          }

          // Extract certificate info
          const validFrom = new Date(peerCert.valid_from).toISOString();
          const validTo = new Date(peerCert.valid_to).toISOString();
          const now = Date.now();
          const daysUntilExpiry = Math.floor((new Date(peerCert.valid_to).getTime() - now) / 86_400_000);

          const subjectAltNames: string[] = peerCert.subjectaltname
            ? peerCert.subjectaltname.split(", ").map((s: string) => s.replace(/^DNS:/, ""))
            : [];

          const isSelfSigned =
            peerCert.subject?.CN === peerCert.issuer?.CN &&
            peerCert.subject?.O === peerCert.issuer?.O &&
            peerCert.fingerprint256 === peerCert.issuerCertificate?.fingerprint256;

          const certificate: CertificateInfo = {
            subject: { CN: peerCert.subject?.CN, O: peerCert.subject?.O, C: peerCert.subject?.C },
            issuer: { CN: peerCert.issuer?.CN, O: peerCert.issuer?.O, C: peerCert.issuer?.C },
            validFrom,
            validTo,
            daysUntilExpiry,
            serialNumber: peerCert.serialNumber,
            fingerprint256: peerCert.fingerprint256,
            subjectAltNames,
            isSelfSigned: !!isSelfSigned,
            signatureAlgorithm: (peerCert as unknown as Record<string, unknown>).sigalg as string ?? "unknown",
          };

          // Walk certificate chain
          const chain: ChainCertificate[] = [];
          const seen = new Set<string>();
          let current = peerCert.issuerCertificate;
          while (current && !seen.has(current.fingerprint256)) {
            seen.add(current.fingerprint256);
            const selfSigned = current.subject?.CN === current.issuer?.CN &&
              current.fingerprint256 === current.issuerCertificate?.fingerprint256;
            chain.push({
              subject: current.subject?.CN ?? "unknown",
              issuer: current.issuer?.CN ?? "unknown",
              validTo: new Date(current.valid_to).toISOString(),
              isSelfSigned: !!selfSigned,
            });
            current = current.issuerCertificate;
          }

          const chainValid = socket.authorized;
          const chainLength = chain.length + 1; // include leaf

          // --- Findings ---

          // Expiry
          if (daysUntilExpiry <= 0) {
            findings.push({ check: "Certificate expiry", status: "fail", message: `Certificate expired ${Math.abs(daysUntilExpiry)} day(s) ago`, details: { daysUntilExpiry, validTo } });
          } else if (daysUntilExpiry <= 7) {
            findings.push({ check: "Certificate expiry", status: "fail", message: `Certificate expires in ${daysUntilExpiry} day(s)`, details: { daysUntilExpiry, validTo } });
          } else if (daysUntilExpiry <= 30) {
            findings.push({ check: "Certificate expiry", status: "warn", message: `Certificate expires in ${daysUntilExpiry} day(s)`, details: { daysUntilExpiry, validTo } });
          } else {
            findings.push({ check: "Certificate expiry", status: "pass", message: `Certificate valid for ${daysUntilExpiry} day(s)`, details: { daysUntilExpiry, validTo } });
          }

          // Chain validity
          if (chainValid) {
            findings.push({ check: "Chain validity", status: "pass", message: "Certificate chain is valid and trusted" });
          } else {
            const authError = socket.authorizationError;
            findings.push({ check: "Chain validity", status: "fail", message: `Certificate chain is not trusted: ${authError}`, details: { authorizationError: authError } });
          }

          // Self-signed
          if (isSelfSigned) {
            findings.push({ check: "Self-signed", status: "fail", message: "Certificate is self-signed" });
          } else {
            findings.push({ check: "Self-signed", status: "pass", message: "Certificate is issued by a CA" });
          }

          // SANs
          if (subjectAltNames.length > 0) {
            findings.push({ check: "Subject Alternative Names", status: "pass", message: `${subjectAltNames.length} SAN(s) present`, details: { subjectAltNames } });
          } else {
            findings.push({ check: "Subject Alternative Names", status: "warn", message: "No SANs found, using CN only" });
          }

          // Signature algorithm
          const sigAlg = certificate.signatureAlgorithm.toLowerCase();
          if (sigAlg.includes("sha1") || sigAlg.includes("sha-1")) {
            findings.push({ check: "Signature algorithm", status: "warn", message: `Weak signature algorithm: ${certificate.signatureAlgorithm}` });
          } else {
            findings.push({ check: "Signature algorithm", status: "pass", message: `Signature algorithm: ${certificate.signatureAlgorithm}` });
          }

          socket.destroy();
          resolve({ certificate, chain, chainValid, chainLength, findings });
        } catch (err) {
          findings.push({ check: "Certificate", status: "fail", message: `Error inspecting certificate: ${err instanceof Error ? err.message : "unknown"}` });
          socket.destroy();
          resolve({ certificate: null, chain: [], chainValid: false, chainLength: 0, findings });
        }
      },
    );

    socket.on("error", (err) => {
      findings.push({ check: "Certificate", status: "fail", message: `TLS connection failed: ${err.message}` });
      resolve({ certificate: null, chain: [], chainValid: false, chainLength: 0, findings });
    });

    socket.on("timeout", () => {
      findings.push({ check: "Certificate", status: "fail", message: "TLS connection timed out" });
      socket.destroy();
      resolve({ certificate: null, chain: [], chainValid: false, chainLength: 0, findings });
    });
  });
}
