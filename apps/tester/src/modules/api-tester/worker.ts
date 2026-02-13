import type { CheckResult, WorkerIncomingMessage, WorkerOutgoingMessage } from "./types.js";
import { allChecks } from "./tests/index.js";

process.on("message", (msg: WorkerIncomingMessage) => {
	if (msg.type !== "run") return;

	try {
		const start = performance.now();
		const results: CheckResult[] = [];

		for (const request of msg.requests) {
			for (const check of allChecks) {
				results.push(...check.fn(request));
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
