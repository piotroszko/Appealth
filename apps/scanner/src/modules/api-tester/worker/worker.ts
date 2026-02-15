import { HttpClient } from "../http-client.js";
import { createChecks } from "../checks/index.js";
import type {
  CheckContext,
  CheckResult,
  WorkerIncomingMessage,
  WorkerOutgoingMessage,
} from "../types.js";

process.on("message", async (msg: WorkerIncomingMessage) => {
  if (msg.type !== "run") return;

  try {
    const start = performance.now();
    const results: CheckResult[] = [];

    const options = msg.options ?? {};

    const httpClient = new HttpClient(options.requestDelayMs, options.fetchTimeoutMs);
    const context: CheckContext = { httpClient, options };
    const checks = createChecks(msg.mode);

    for (const request of msg.requests) {
      for (const check of checks) {
        results.push(...(await check.run(request, context)));
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
