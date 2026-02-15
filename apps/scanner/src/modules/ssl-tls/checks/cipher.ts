import tls from "node:tls";
import type { CipherResult, CipherInfo, CheckFinding } from "../types.js";

const INSECURE_PATTERNS = ["NULL", "EXPORT", "anon", "RC4", "DES-CBC"];
const WEAK_PATTERNS = ["3DES"];
const STRONG_PATTERNS = ["AES256", "AES_256", "CHACHA20_POLY1305"];

function classifyStrength(name: string): CipherInfo["strength"] {
  const upper = name.toUpperCase();
  if (INSECURE_PATTERNS.some((p) => upper.includes(p))) return "insecure";
  if (WEAK_PATTERNS.some((p) => upper.includes(p))) return "weak";
  if (STRONG_PATTERNS.some((p) => upper.includes(p))) return "strong";
  return "acceptable";
}

export async function checkCipher(hostname: string, port: number): Promise<CipherResult> {
  const findings: CheckFinding[] = [];

  return new Promise((resolve) => {
    const socket = tls.connect(
      { host: hostname, port, servername: hostname, rejectUnauthorized: false, timeout: 8_000 },
      () => {
        try {
          const cipher = socket.getCipher();
          const strength = classifyStrength(cipher.name);

          const negotiatedCipher: CipherInfo = {
            name: cipher.name,
            version: cipher.version,
            bits: (cipher as unknown as { bits: number }).bits ?? 0,
            strength,
          };

          // Cipher strength finding
          switch (strength) {
            case "insecure":
              findings.push({
                check: "Cipher strength",
                status: "fail",
                message: `Insecure cipher negotiated: ${cipher.name}`,
                details: { cipher: cipher.name, bits: negotiatedCipher.bits },
              });
              break;
            case "weak":
              findings.push({
                check: "Cipher strength",
                status: "warn",
                message: `Weak cipher negotiated: ${cipher.name}`,
                details: { cipher: cipher.name, bits: negotiatedCipher.bits },
              });
              break;
            case "strong":
              findings.push({
                check: "Cipher strength",
                status: "pass",
                message: `Strong cipher negotiated: ${cipher.name} (${negotiatedCipher.bits}-bit)`,
                details: { cipher: cipher.name, bits: negotiatedCipher.bits },
              });
              break;
            case "acceptable":
              findings.push({
                check: "Cipher strength",
                status: "pass",
                message: `Acceptable cipher negotiated: ${cipher.name} (${negotiatedCipher.bits}-bit)`,
                details: { cipher: cipher.name, bits: negotiatedCipher.bits },
              });
              break;
          }

          // Forward secrecy
          const cipherName = cipher.name.toUpperCase();
          if (cipherName.includes("ECDHE") || cipherName.includes("DHE")) {
            findings.push({
              check: "Forward secrecy",
              status: "pass",
              message: "Forward secrecy is supported (ECDHE/DHE key exchange)",
            });
          } else {
            findings.push({
              check: "Forward secrecy",
              status: "warn",
              message: "No forward secrecy detected (RSA key exchange)",
            });
          }

          // AEAD mode
          if (cipherName.includes("GCM") || cipherName.includes("POLY1305")) {
            findings.push({
              check: "AEAD cipher mode",
              status: "pass",
              message: "AEAD cipher mode in use (GCM/POLY1305)",
            });
          } else if (cipherName.includes("CBC")) {
            findings.push({
              check: "AEAD cipher mode",
              status: "info",
              message: "CBC cipher mode in use (AEAD preferred)",
            });
          }

          socket.destroy();
          resolve({ negotiatedCipher, findings });
        } catch (err) {
          findings.push({
            check: "Cipher",
            status: "fail",
            message: `Error reading cipher: ${err instanceof Error ? err.message : "unknown"}`,
          });
          socket.destroy();
          resolve({ negotiatedCipher: null, findings });
        }
      },
    );

    socket.on("error", (err) => {
      findings.push({
        check: "Cipher",
        status: "fail",
        message: `TLS connection failed: ${err.message}`,
      });
      resolve({ negotiatedCipher: null, findings });
    });

    socket.on("timeout", () => {
      findings.push({ check: "Cipher", status: "fail", message: "TLS connection timed out" });
      socket.destroy();
      resolve({ negotiatedCipher: null, findings });
    });
  });
}
