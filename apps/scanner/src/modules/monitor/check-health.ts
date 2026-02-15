import type { MonitorCheckResult } from "./types.js";

export async function checkHealth(url: string, timeoutMs: number): Promise<MonitorCheckResult> {
  const start = performance.now();

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      redirect: "follow",
    });

    await response.arrayBuffer();

    const responseTimeMs = Math.round(performance.now() - start);

    return {
      statusCode: response.status,
      responseTimeMs,
      error: null,
    };
  } catch (err) {
    const responseTimeMs = Math.round(performance.now() - start);
    const error = err instanceof Error ? err.message : String(err);

    return {
      statusCode: null,
      responseTimeMs,
      error,
    };
  }
}
