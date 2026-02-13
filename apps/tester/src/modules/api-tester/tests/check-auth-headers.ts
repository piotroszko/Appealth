import type { CheckDefinition, CheckResult } from "../types.js";

const SENSITIVE_HEADERS = ["authorization", "cookie", "set-cookie"];

export const checkAuthHeaders: CheckDefinition = {
	name: "auth-headers",
	description: "Flags Authorization/Cookie headers sent over non-HTTPS connections",
	fn(request) {
		const { url, method, requestHeaders } = request;
		const base = { checkName: "auth-headers", request: { url, method } };

		if (!url.startsWith("http://")) {
			return [];
		}

		const lowerHeaders = Object.fromEntries(
			Object.entries(requestHeaders).map(([k, v]) => [k.toLowerCase(), v]),
		);

		const results: CheckResult[] = [];

		for (const header of SENSITIVE_HEADERS) {
			if (lowerHeaders[header]) {
				results.push({
					...base,
					passed: false,
					severity: "error",
					message: `Sensitive header "${header}" sent over HTTP`,
					details: `The ${header} header is being transmitted over an unencrypted connection`,
				});
			}
		}

		return results;
	},
};
