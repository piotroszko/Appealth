import type { CheckDefinition, CheckResult } from "../../types.js";

const SENSITIVE_KEYS = new Set([
	"password",
	"passwd",
	"pass",
	"token",
	"secret",
	"api_key",
	"apikey",
	"api-key",
	"access_token",
	"auth",
	"credential",
	"private_key",
	"client_secret",
]);

export const checkSensitiveData: CheckDefinition = {
	name: "sensitive-data",
	description: "Flags query parameters with sensitive-looking keys",
	fn(request) {
		const { url, method, queryParams } = request;
		const base = { checkName: "sensitive-data", request: { url, method } };

		const results: CheckResult[] = [];

		for (const key of Object.keys(queryParams)) {
			if (SENSITIVE_KEYS.has(key.toLowerCase())) {
				results.push({
					...base,
					severity: "error",
					message: `Sensitive parameter "${key}" found in query string`,
					details: `The query parameter "${key}" may contain sensitive data and should not be passed in the URL`,
				});
			}
		}

		return results;
	},
};
