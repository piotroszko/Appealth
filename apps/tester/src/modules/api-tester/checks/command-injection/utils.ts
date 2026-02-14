import { COMMAND_INJECTION_PAYLOADS, type CommandInjectionPayload } from "./payloads.js";

const payloadMap = new Map<string, CommandInjectionPayload>(
  COMMAND_INJECTION_PAYLOADS.map((p) => [p.payload, p]),
);

export function matchCommandOutput(
  body: string,
  payload: string,
): { os: string; evidence: string } | undefined {
  const entry = payloadMap.get(payload);
  if (!entry) return undefined;

  for (const pattern of entry.patterns) {
    const m = pattern.exec(body);
    if (m) {
      const os = entry.os === "unix" ? "Unix" : entry.os === "windows" ? "Windows" : "Both";
      const evidence = m[0].length > 80 ? m[0].slice(0, 80) + "..." : m[0];
      return { os, evidence };
    }
  }

  return undefined;
}
