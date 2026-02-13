import { fork } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import type { CapturedRequest } from "../../types/index.js";
import type { ApiTesterResponse, WorkerIncomingMessage, WorkerOutgoingMessage } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKER_PATH = path.join(__dirname, "worker.ts");
const TIMEOUT_MS = 30_000;

import type { ApiTesterOptions } from "./types.js";

export function runChecks(
  requests: CapturedRequest[],
  options: ApiTesterOptions = {},
): Promise<ApiTesterResponse> {
  return new Promise((resolve, reject) => {
    const worker = fork(WORKER_PATH, [], {
      execArgv: ["--import", "tsx/esm"],
      stdio: ["ignore", "inherit", "inherit", "ipc"],
    });

    const timeout = setTimeout(() => {
      worker.kill();
      reject(new Error("Worker timed out after 30s"));
    }, TIMEOUT_MS);

    worker.on("message", (msg: WorkerOutgoingMessage) => {
      clearTimeout(timeout);

      if (msg.type === "done") {
        const errors = msg.results.filter((r) => r.severity === "error").length;
        const warnings = msg.results.filter((r) => r.severity === "warning").length;
        resolve({
          results: msg.results,
          summary: {
            total: msg.results.length,
            errors,
            warnings,
            durationMs: msg.durationMs,
          },
        });
      } else {
        reject(new Error(msg.message));
      }
    });

    worker.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    worker.on("exit", (code) => {
      clearTimeout(timeout);
      if (code && code !== 0) {
        reject(new Error(`Worker exited with code ${code}`));
      }
    });

    const message: WorkerIncomingMessage = { type: "run", requests, options };
    worker.send(message);
  });
}
