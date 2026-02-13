import type { CheckDefinition } from "../types.js";
import { checkStatusCodes } from "./check-status-codes.js";
import { checkResponseHeaders } from "./check-response-headers.js";
import { checkHttps } from "./check-https.js";
import { checkAuthHeaders } from "./check-auth-headers.js";
import { checkSensitiveData } from "./check-sensitive-data.js";

export const allChecks: CheckDefinition[] = [
	checkStatusCodes,
	checkResponseHeaders,
	checkHttps,
	checkAuthHeaders,
	checkSensitiveData,
];
