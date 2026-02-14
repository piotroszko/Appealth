import dgram from "node:dgram";
import dnsPacket from "dns-packet";
import type { DnssecResult, CheckFinding } from "../types.js";

function sendDnsQuery(buf: Buffer, server: string, port: number, timeoutMs: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const socket = dgram.createSocket("udp4");
    const timer = setTimeout(() => {
      socket.close();
      reject(new Error("DNS query timed out"));
    }, timeoutMs);

    socket.on("message", (msg) => {
      clearTimeout(timer);
      socket.close();
      resolve(msg);
    });

    socket.on("error", (err) => {
      clearTimeout(timer);
      socket.close();
      reject(err);
    });

    socket.send(buf, 0, buf.length, port, server);
  });
}

export async function checkDnssec(domain: string): Promise<DnssecResult> {
  const findings: CheckFinding[] = [];

  try {
    // Build A query with EDNS0 DO (DNSSEC OK) flag
    const query: dnsPacket.Packet = {
      type: "query",
      id: Math.floor(Math.random() * 65535),
      flags: dnsPacket.RECURSION_DESIRED | dnsPacket.CHECKING_DISABLED,
      questions: [{ type: "A", name: domain }],
      additionals: [
        {
          type: "OPT",
          name: ".",
          udpPayloadSize: 4096,
          extendedRcode: 0,
          ednsVersion: 0,
          flags: dnsPacket.DNSSEC_OK,
          flag_do: true,
          options: [],
        },
      ],
    };

    const buf = dnsPacket.encode(query);
    const responseBuf = await sendDnsQuery(buf, "8.8.8.8", 53, 5000);
    const response = dnsPacket.decode(responseBuf);

    const answers = response.answers ?? [];
    const hasRrsig = answers.some((a) => a.type === "RRSIG");

    // Also check without CD flag to see if AD is set
    const query2: dnsPacket.Packet = {
      type: "query",
      id: Math.floor(Math.random() * 65535),
      flags: dnsPacket.RECURSION_DESIRED,
      questions: [{ type: "A", name: domain }],
      additionals: [
        {
          type: "OPT",
          name: ".",
          udpPayloadSize: 4096,
          extendedRcode: 0,
          ednsVersion: 0,
          flags: dnsPacket.DNSSEC_OK,
          flag_do: true,
          options: [],
        },
      ],
    };

    const buf2 = dnsPacket.encode(query2);
    const responseBuf2 = await sendDnsQuery(buf2, "8.8.8.8", 53, 5000);
    const response2 = dnsPacket.decode(responseBuf2);
    const adFlagValidated = response2.flag_ad ?? false;

    const enabled = hasRrsig || adFlagValidated;

    if (adFlagValidated) {
      findings.push({ check: "DNSSEC", status: "pass", message: "DNSSEC is enabled and validated (AD flag set)" });
    } else if (hasRrsig) {
      findings.push({ check: "DNSSEC", status: "warn", message: "DNSSEC signatures (RRSIG) present but validation failed (AD flag not set)" });
    } else {
      findings.push({ check: "DNSSEC", status: "info", message: "DNSSEC is not enabled for this domain" });
    }

    return { enabled, hasRrsig, adFlag: adFlagValidated, findings };
  } catch (err) {
    findings.push({
      check: "DNSSEC",
      status: "info",
      message: `DNSSEC check failed: ${err instanceof Error ? err.message : "unknown error"}`,
    });
    return { enabled: false, hasRrsig: false, adFlag: false, findings };
  }
}
