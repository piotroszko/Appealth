export const SQL_PAYLOADS = [
	"' OR '1'='1",
	"1' OR '1'='1'--",
	"' UNION SELECT NULL--",
	"1; DROP TABLE test--",
	"' AND 1=CONVERT(int, @@version)--",
];

export const SQL_ERROR_PATTERNS: { engine: string; pattern: RegExp }[] = [
	// MySQL
	{ engine: "MySQL", pattern: /you have an error in your sql syntax/i },
	{ engine: "MySQL", pattern: /warning.*\bmysql_/i },
	{ engine: "MySQL", pattern: /mysql_fetch/i },
	{ engine: "MySQL", pattern: /MySQLSyntaxErrorException/i },
	{ engine: "MySQL", pattern: /SQL syntax.*MySQL/i },

	// Generic / PDO
	{ engine: "Generic", pattern: /SQLSTATE\[/i },
	{ engine: "Generic", pattern: /unclosed quotation mark/i },
	{ engine: "Generic", pattern: /quoted string not properly terminated/i },

	// PostgreSQL
	{ engine: "PostgreSQL", pattern: /pg_query\(\)/i },
	{ engine: "PostgreSQL", pattern: /pg_exec\(\)/i },
	{ engine: "PostgreSQL", pattern: /ERROR:\s+syntax error at or near/i },
	{ engine: "PostgreSQL", pattern: /unterminated quoted string at or near/i },

	// SQLite
	{ engine: "SQLite", pattern: /SQLite3::query/i },
	{ engine: "SQLite", pattern: /SQLITE_ERROR/i },
	{ engine: "SQLite", pattern: /unrecognized token/i },

	// SQL Server / JDBC
	{ engine: "SQL Server", pattern: /org\.hibernate/i },
	{ engine: "SQL Server", pattern: /jdbc\.SQLServerException/i },
	{ engine: "SQL Server", pattern: /microsoft\.jet\.oledb/i },

	// Oracle
	{ engine: "Oracle", pattern: /ORA-\d{5}/i },
	{ engine: "Oracle", pattern: /SQL command not properly ended/i },
];
