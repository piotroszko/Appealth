import type { CheckDefinition } from "../../../types.js";
import { isAllowedDomain } from "../../../utils.js";
import { parseBodyFields } from "./utils.js";
import { testQueryParams } from "./test-query-params.js";
import { testBodyFields } from "./test-body-fields.js";
import { testUrlPath } from "./test-url-path.js";
import { testHeaders } from "./test-headers.js";

export const checkSqlInjection: CheckDefinition = {
	name: "sql-injection",
	description:
		"Attempts SQL injection on query params, body fields, URL path, and headers, flags responses that resemble SQL errors",
	async fn(request, options) {
		const { url, method, requestHeaders, queryParams, postData } = request;

		if (!isAllowedDomain(url, options.domains)) {
			return [];
		}

		const base = { checkName: "sql-injection", request: { url, method } };

		const hasQueryParams = Object.keys(queryParams).length > 0;
		const contentType = Object.entries(requestHeaders).find(
			([k]) => k.toLowerCase() === "content-type",
		)?.[1];
		const bodyFields = postData ? parseBodyFields(postData, contentType) : null;

		const results = await Promise.all([
			testUrlPath(request, base),
			hasQueryParams ? testQueryParams(request, base) : [],
			bodyFields ? testBodyFields(request, bodyFields, contentType, base) : [],
			testHeaders(request, base),
		]);

		return results.flat();
	},
};
