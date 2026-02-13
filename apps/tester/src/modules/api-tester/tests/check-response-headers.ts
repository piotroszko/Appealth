import type { CheckDefinition, CheckResult } from "../types.js";

const SECURITY_HEADERS = [
	{ header: "x-content-type-options", expected: "nosniff" },
	{ header: "x-frame-options" },
	{ header: "strict-transport-security" },
	{ header: "content-security-policy" },
];

const DOCUMENT_TYPES = new Set(["document", "html"]);

export const checkResponseHeaders: CheckDefinition = {
	name: "response-headers",
	description: "Checks for missing security headers on document responses",
	fn(request) {
		const { url, method, resourceType, responseHeaders } = request;
		const base = { checkName: "response-headers", request: { url, method } };

		if (!DOCUMENT_TYPES.has(resourceType)) {
			return [];
		}

		if (!responseHeaders) {
			return [
				{
					...base,
					severity: "warning",
					message: "No response headers available to check",
				},
			];
		}

		const lowerHeaders = Object.fromEntries(
			Object.entries(responseHeaders).map(([k, v]) => [k.toLowerCase(), v]),
		);

		const results: CheckResult[] = [];

		for (const { header, expected } of SECURITY_HEADERS) {
			const value = lowerHeaders[header];
			if (!value) {
				results.push({
					...base,
					severity: "warning",
					message: `Missing security header: ${header}`,
					details: `The response does not include the ${header} header`,
				});
			} else if (expected && value.toLowerCase() !== expected) {
				results.push({
					...base,
					severity: "warning",
					message: `Unexpected value for ${header}: "${value}"`,
					details: `Expected "${expected}" but got "${value}"`,
				});
			}
		}

		return results;
	},
};
