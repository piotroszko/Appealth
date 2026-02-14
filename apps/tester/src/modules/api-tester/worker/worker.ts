import { configureFetch } from "./fetch-wrapper.js";
import { allChecks } from "../tests/index.js";
import type { CheckResult, WorkerIncomingMessage, WorkerOutgoingMessage } from "../types.js";

process.on("message", async (msg: WorkerIncomingMessage) => {
  if (msg.type !== "run") return;

  try {
    const start = performance.now();
    const results: CheckResult[] = [];

    const options = msg.options ?? {};

    configureFetch({
      requestDelayMs: options.requestDelayMs,
      fetchTimeoutMs: options.fetchTimeoutMs,
    });

    for (const request of msg.requests) {
      for (const check of allChecks) {
        results.push(...(await check.fn(request, options)));
      }
    }

    const durationMs = Math.round(performance.now() - start);

    const response: WorkerOutgoingMessage = { type: "done", results, durationMs };
    process.send!(response);
  } catch (error) {
    const response: WorkerOutgoingMessage = {
      type: "error",
      message: error instanceof Error ? error.message : String(error),
    };
    process.send!(response);
  }

  process.exit(0);
});
