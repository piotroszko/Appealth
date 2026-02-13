import type { CheckDefinition, CheckResult } from "../../types.js";

const SQL_PAYLOADS = [
	"' OR '1'='1",
	"1' OR '1'='1'--",
	"' UNION SELECT NULL--",
	"1; DROP TABLE test--",
	"' AND 1=CONVERT(int, @@version)--",
];

const SQL_ERROR_PATTERNS = [
	/you have an error in your sql syntax/i,
	/warning.*\bmysql_/i,
	/mysql_fetch/i,
	/MySQLSyntaxErrorException/i,
	/SQL syntax.*MySQL/i,
	/SQLSTATE\[/i,
	/unclosed quotation mark/i,
	/quoted string not properly terminated/i,
	/pg_query\(\)/i,
	/pg_exec\(\)/i,
	/ERROR:\s+syntax error at or near/i,
	/unterminated quoted string at or near/i,
	/SQLite3::query/i,
	/SQLITE_ERROR/i,
	/unrecognized token/i,
	/org\.hibernate/i,
	/jdbc\.SQLServerException/i,
	/microsoft\.jet\.oledb/i,
	/ORA-\d{5}/i,
	/SQL command not properly ended/i,
];

const FETCH_TIMEOUT_MS = 5_000;

function parseBodyFields(postData: string, contentType: string | undefined): Record<string, string> | null {
	if (!postData) return null;

	if (contentType?.includes("application/json")) {
		try {
			const parsed = JSON.parse(postData);
			if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
				const fields: Record<string, string> = {};
				for (const [key, value] of Object.entries(parsed)) {
					if (typeof value === "string" || typeof value === "number") {
						fields[key] = String(value);
					}
				}
				return Object.keys(fields).length > 0 ? fields : null;
			}
		} catch {
			return null;
		}
	}

	if (!contentType || contentType.includes("application/x-www-form-urlencoded")) {
		try {
			const params = new URLSearchParams(postData);
			const fields: Record<string, string> = {};
			for (const [key, value] of params.entries()) {
				fields[key] = value;
			}
			return Object.keys(fields).length > 0 ? fields : null;
		} catch {
			return null;
		}
	}

	return null;
}

function matchesSqlError(body: string): RegExp | undefined {
	return SQL_ERROR_PATTERNS.find((pattern) => pattern.test(body));
}

async function tryFetch(url: string, init: RequestInit): Promise<string | null> {
	try {
		const res = await fetch(url, {
			...init,
			signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
			redirect: "follow",
		});
		return await res.text();
	} catch {
		return null;
	}
}

async function testQueryParams(
	request: { url: string; method: string; requestHeaders: Record<string, string>; queryParams: Record<string, string> },
	base: { checkName: string; request: { url: string; method: string } },
): Promise<CheckResult[]> {
	const results: CheckResult[] = [];
	const parsed = new URL(request.url);

	for (const [param, originalValue] of Object.entries(request.queryParams)) {
		for (const payload of SQL_PAYLOADS) {
			const injectedUrl = new URL(parsed.toString());
			injectedUrl.searchParams.set(param, originalValue + payload);

			const body = await tryFetch(injectedUrl.toString(), {
				method: request.method,
				headers: { ...request.requestHeaders },
			});

			if (!body) continue;

			const matched = matchesSqlError(body);
			if (matched) {
				results.push({
					...base,
					severity: "error",
					message: `Possible SQL injection via query param "${param}"`,
					details: `Payload "${payload}" in param "${param}" triggered SQL error pattern: ${matched}`,
				});
				break;
			}
		}
	}

	return results;
}

async function testBodyFields(
	request: { url: string; method: string; requestHeaders: Record<string, string>; postData: string | null },
	fields: Record<string, string>,
	contentType: string | undefined,
	base: { checkName: string; request: { url: string; method: string } },
): Promise<CheckResult[]> {
	const results: CheckResult[] = [];
	const isJson = contentType?.includes("application/json");

	for (const [field, originalValue] of Object.entries(fields)) {
		for (const payload of SQL_PAYLOADS) {
			const injectedValue = originalValue + payload;
			let injectedBody: string;
			let bodyContentType: string;

			if (isJson) {
				const original = JSON.parse(request.postData!);
				original[field] = injectedValue;
				injectedBody = JSON.stringify(original);
				bodyContentType = "application/json";
			} else {
				const params = new URLSearchParams(request.postData!);
				params.set(field, injectedValue);
				injectedBody = params.toString();
				bodyContentType = "application/x-www-form-urlencoded";
			}

			const headers = { ...request.requestHeaders, "content-type": bodyContentType };
			const body = await tryFetch(request.url, {
				method: request.method,
				headers,
				body: injectedBody,
			});

			if (!body) continue;

			const matched = matchesSqlError(body);
			if (matched) {
				results.push({
					...base,
					severity: "error",
					message: `Possible SQL injection via body field "${field}"`,
					details: `Payload "${payload}" in field "${field}" triggered SQL error pattern: ${matched}`,
				});
				break;
			}
		}
	}

	return results;
}

export const checkMysqlInjection: CheckDefinition = {
	name: "mysql-injection",
	description: "Attempts SQL injection on query params and body fields, flags responses that resemble SQL errors",
	async fn(request) {
		const { url, method, requestHeaders, queryParams, postData } = request;
		const base = { checkName: "mysql-injection", request: { url, method } };

		const hasQueryParams = Object.keys(queryParams).length > 0;
		const contentType = Object.entries(requestHeaders).find(
			([k]) => k.toLowerCase() === "content-type",
		)?.[1];
		const bodyFields = postData ? parseBodyFields(postData, contentType) : null;

		if (!hasQueryParams && !bodyFields) {
			return [];
		}

		const results: CheckResult[] = [];

		if (hasQueryParams) {
			results.push(...(await testQueryParams(request, base)));
		}

		if (bodyFields) {
			results.push(...(await testBodyFields(request, bodyFields, contentType, base)));
		}

		return results;
	},
};
