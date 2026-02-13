import type { CapturedRequest } from "../../types/index.js";

export type CheckSeverity = "error" | "warning" | "info";

export interface CheckResult {
	checkName: string;
	request: { url: string; method: string };
	passed: boolean;
	severity: CheckSeverity;
	message: string;
	details?: string;
}

export type CheckFn = (request: CapturedRequest) => CheckResult[];

export interface CheckDefinition {
	name: string;
	description: string;
	fn: CheckFn;
}

export interface ApiTesterRequestBody {
	requests: CapturedRequest[];
}

export interface ApiTesterResponse {
	results: CheckResult[];
	summary: {
		total: number;
		passed: number;
		failed: number;
		durationMs: number;
	};
}

export type WorkerIncomingMessage = {
	type: "run";
	requests: CapturedRequest[];
};

export type WorkerOutgoingMessage =
	| { type: "done"; results: CheckResult[]; durationMs: number }
	| { type: "error"; message: string };
