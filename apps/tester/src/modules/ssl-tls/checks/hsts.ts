import type { HstsResult, CheckFinding } from "../types.js";

const MIN_MAX_AGE = 31_536_000; // 1 year in seconds

export async function checkHsts(hostname: string): Promise<HstsResult> {
  const findings: CheckFinding[] = [];

  try {
    const response = await fetch(`https://${hostname}`, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
    });

    const rawHeader = response.headers.get("strict-transport-security");

    if (!rawHeader) {
      findings.push({
        check: "HSTS",
        status: "fail",
        message: "Strict-Transport-Security header is absent",
      });
      return {
        present: false,
        maxAge: null,
        includeSubDomains: false,
        preload: false,
        rawHeader: null,
        findings,
      };
    }

    findings.push({
      check: "HSTS",
      status: "pass",
      message: "Strict-Transport-Security header is present",
    });

    // Parse directives
    const directives = rawHeader
      .toLowerCase()
      .split(";")
      .map((d) => d.trim());

    let maxAge: number | null = null;
    let includeSubDomains = false;
    let preload = false;

    for (const directive of directives) {
      if (directive.startsWith("max-age=")) {
        maxAge = parseInt(directive.split("=")[1]!, 10);
      } else if (directive === "includesubdomains") {
        includeSubDomains = true;
      } else if (directive === "preload") {
        preload = true;
      }
    }

    // max-age finding
    if (maxAge !== null) {
      if (maxAge >= MIN_MAX_AGE) {
        findings.push({
          check: "HSTS max-age",
          status: "pass",
          message: `max-age is ${maxAge} (>= ${MIN_MAX_AGE})`,
          details: { maxAge },
        });
      } else {
        findings.push({
          check: "HSTS max-age",
          status: "warn",
          message: `max-age is ${maxAge} (< ${MIN_MAX_AGE}, recommended minimum)`,
          details: { maxAge },
        });
      }
    }

    // includeSubDomains finding
    if (includeSubDomains) {
      findings.push({
        check: "HSTS includeSubDomains",
        status: "pass",
        message: "includeSubDomains directive is present",
      });
    } else {
      findings.push({
        check: "HSTS includeSubDomains",
        status: "info",
        message: "includeSubDomains directive is absent",
      });
    }

    // preload finding
    if (preload) {
      findings.push({
        check: "HSTS preload",
        status: "pass",
        message: "preload directive is present",
      });
    } else {
      findings.push({
        check: "HSTS preload",
        status: "info",
        message: "preload directive is absent",
      });
    }

    return { present: true, maxAge, includeSubDomains, preload, rawHeader, findings };
  } catch (err) {
    findings.push({
      check: "HSTS",
      status: "fail",
      message: `Failed to fetch HTTPS response: ${err instanceof Error ? err.message : "unknown"}`,
    });
    return {
      present: false,
      maxAge: null,
      includeSubDomains: false,
      preload: false,
      rawHeader: null,
      findings,
    };
  }
}
