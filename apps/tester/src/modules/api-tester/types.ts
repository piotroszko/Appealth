import type { CapturedRequest } from "../../types/index.js";

export type CheckSeverity = "error" | "warning";

export interface CheckResult {
	checkName: string;
	request: { url: string; method: string };
	severity: CheckSeverity;
	message: string;
	details?: string;
}

export interface ApiTesterOptions {
	domains?: string[];
}

export type CheckFn = (request: CapturedRequest, options: ApiTesterOptions) => CheckResult[] | Promise<CheckResult[]>;

export interface CheckDefinition {
	name: string;
	description: string;
	fn: CheckFn;
}

export interface ApiTesterRequestBody {
	requests: CapturedRequest[];
	options?: ApiTesterOptions;
}

export interface ApiTesterResponse {
	results: CheckResult[];
	summary: {
		total: number;
		errors: number;
		warnings: number;
		durationMs: number;
	};
}

export type WorkerIncomingMessage = {
	type: "run";
	requests: CapturedRequest[];
	options: ApiTesterOptions;
};

export type WorkerOutgoingMessage =
	| { type: "done"; results: CheckResult[]; durationMs: number }
	| { type: "error"; message: string };
