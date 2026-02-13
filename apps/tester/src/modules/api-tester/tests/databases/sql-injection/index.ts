import type { CheckDefinition } from "../../../types.js";
import { parseBodyFields } from "./utils.js";
import { testQueryParams } from "./test-query-params.js";
import { testBodyFields } from "./test-body-fields.js";

export const checkSqlInjection: CheckDefinition = {
	name: "sql-injection",
	description: "Attempts SQL injection on query params and body fields, flags responses that resemble SQL errors",
	async fn(request) {
		const { url, method, requestHeaders, queryParams, postData } = request;
		const base = { checkName: "sql-injection", request: { url, method } };

		const hasQueryParams = Object.keys(queryParams).length > 0;
		const contentType = Object.entries(requestHeaders).find(([k]) => k.toLowerCase() === "content-type")?.[1];
		const bodyFields = postData ? parseBodyFields(postData, contentType) : null;

		if (!hasQueryParams && !bodyFields) {
			return [];
		}

		const results = await Promise.all([
			hasQueryParams ? testQueryParams(request, base) : [],
			bodyFields ? testBodyFields(request, bodyFields, contentType, base) : [],
		]);

		return results.flat();
	},
};
