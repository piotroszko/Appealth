export interface InfoLeakPattern {
  label: string;
  pattern: RegExp;
}

export const SENSITIVE_KEYS = new Set([
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

export const STACK_TRACE_PATTERNS: InfoLeakPattern[] = [
  { label: "Java stack trace", pattern: /at\s+[\w$.]+\([\w]+\.java:\d+\)/i },
  {
    label: "Python traceback",
    pattern: /Traceback \(most recent call last\):|File ".*", line \d+/i,
  },
  {
    label: "PHP stack trace",
    pattern: /#\d+\s+[\w\\/]+\.php\(\d+\):|Fatal error:.*in\s+\/\S+\.php on line \d+/i,
  },
  {
    label: "Node.js stack trace",
    pattern: /at\s+\S+\s+\((?:\/|[A-Z]:\\)\S+\.(?:js|ts|mjs|cjs):\d+:\d+\)/,
  },
  {
    label: ".NET stack trace",
    pattern: /at\s+[\w.]+\s+in\s+\S+\.cs:line\s+\d+|System\.\w+Exception:/,
  },
  {
    label: "Ruby stack trace",
    pattern: /from\s+\S+\.rb:\d+:in\s+`\w+'/,
  },
  {
    label: "Go stack trace",
    pattern: /goroutine\s+\d+\s+\[running\]:|\.go:\d+\s+\+0x[0-9a-f]+/i,
  },
];

export const VERSION_HEADER_NAMES = new Set([
  "x-powered-by",
  "server",
  "x-aspnet-version",
  "x-aspnetmvc-version",
  "x-generator",
  "x-drupal-cache",
  "x-varnish",
  "x-runtime",
]);

export const VERSION_HEADER_PATTERNS: InfoLeakPattern[] = [
  { label: "PHP version", pattern: /PHP\/[\d.]+/i },
  { label: "Apache version", pattern: /Apache\/[\d.]+/i },
  { label: "nginx version", pattern: /nginx\/[\d.]+/i },
  { label: "Express framework", pattern: /\bExpress\b/i },
  { label: "ASP.NET version", pattern: /ASP\.NET|[\d.]+/i },
  { label: "OpenResty version", pattern: /openresty\/[\d.]+/i },
  { label: "IIS version", pattern: /Microsoft-IIS\/[\d.]+/i },
  { label: "Kestrel server", pattern: /\bKestrel\b/i },
  { label: "Jetty version", pattern: /Jetty\([\d.]+/i },
  { label: "Tomcat version", pattern: /Apache-Coyote\/[\d.]+|Tomcat\/[\d.]+/i },
];

export const FRAMEWORK_BODY_PATTERNS: InfoLeakPattern[] = [
  { label: "WordPress", pattern: /wp-content\/|wp-includes\/|WordPress/i },
  { label: "Laravel", pattern: /laravel_session|Laravel/i },
  { label: "Django", pattern: /csrfmiddlewaretoken|Django/i },
  { label: "Rails", pattern: /Rails\.application|action_dispatch|Ruby on Rails/i },
  { label: "Spring", pattern: /org\.springframework\.|Whitelabel Error Page/i },
  { label: "ASP.NET", pattern: /__VIEWSTATE|__EVENTVALIDATION|aspnet_/i },
  { label: "Next.js", pattern: /__NEXT_DATA__|_next\/static/i },
  { label: "Nuxt.js", pattern: /__NUXT__|_nuxt\//i },
];

export const INTERNAL_PATH_PATTERNS: InfoLeakPattern[] = [
  { label: "Unix path", pattern: /\/usr\/(?:local\/|lib\/|share\/)/i },
  { label: "Web root path", pattern: /\/var\/www\//i },
  { label: "Home directory path", pattern: /\/home\/\w+\//i },
  { label: "Windows path", pattern: /[A-Z]:\\(?:Users|Windows|inetpub|Program Files)\\/i },
  { label: "node_modules path", pattern: /node_modules\/[\w@-]+/i },
  { label: "Python site-packages path", pattern: /site-packages\/[\w-]+/i },
  { label: "Java WEB-INF path", pattern: /WEB-INF\//i },
  { label: "Temp directory path", pattern: /\/tmp\/[\w.-]+/i },
];

export const DB_ERROR_PATTERNS: InfoLeakPattern[] = [
  {
    label: "MySQL error",
    pattern: /You have an error in your SQL syntax|mysql_fetch|mysqli_/i,
  },
  {
    label: "PostgreSQL error",
    pattern: /pg_query|pg_exec|ERROR:\s+syntax error at or near/i,
  },
  {
    label: "Oracle error",
    pattern: /ORA-\d{5}:|Oracle error/i,
  },
  {
    label: "SQLite error",
    pattern: /SQLite3?::(?:SQLException|Exception)|SQLITE_ERROR/i,
  },
  {
    label: "MSSQL error",
    pattern: /Microsoft SQL Native Client|ODBC SQL Server Driver|\[SQL Server\]/i,
  },
  {
    label: "MongoDB error",
    pattern: /MongoError|MongoServerError|mongoose.*Error/i,
  },
];

export const DEBUG_PATTERNS: InfoLeakPattern[] = [
  { label: "Debug mode enabled", pattern: /"debug"\s*:\s*true/i },
  { label: "Stack in response", pattern: /"stack"\s*:\s*"[^"]*\\n/i },
  {
    label: "Development environment",
    pattern: /"environment"\s*:\s*"development"|NODE_ENV.*development/i,
  },
  { label: "Verbose error object", pattern: /"errno"\s*:\s*-?\d+.*"syscall"\s*:/i },
  { label: "Debug toolbar", pattern: /django[._]debug[._]toolbar|__debug__\//i },
  { label: "Xdebug", pattern: /xdebug-profile|Xdebug/i },
];

export const MALFORMED_JSON_PAYLOADS: { label: string; body: string }[] = [
  { label: "truncated JSON", body: '{"key": "val' },
  { label: "invalid JSON", body: "{key: value}" },
  { label: "prototype pollution attempt", body: '{"__proto__": {"test": 1}}' },
  { label: "empty body", body: "" },
  { label: "array instead of object", body: "[1,2,3]" },
  { label: "control characters", body: '{"key": "\x00\x01\x02"}' },
];

export const WRONG_CONTENT_TYPES = [
  "application/xml",
  "text/plain",
  "multipart/form-data",
  "application/octet-stream",
];

export const ERROR_TRIGGER_PATHS = [
  "/%00",
  "/%2e%2e/%2e%2e/etc/passwd",
  "/<script>",
  "/api/v99999/nonexistent",
  "/..%252f..%252f",
  "/%c0%ae%c0%ae/",
];

// ── PII / credential patterns ──────────────────────────────────────

export interface PiiPattern {
  label: string;
  pattern: RegExp;
  /** When true, matched digits are validated with Luhn before reporting. */
  luhn?: boolean;
}

export const PII_PATTERNS: PiiPattern[] = [
  // Email addresses
  {
    label: "Email address",
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
  },

  // Credit card numbers (13-19 digits, optionally separated by spaces/dashes)
  {
    label: "Credit card number",
    pattern: /\b(?:\d[ -]*?){13,19}\b/,
    luhn: true,
  },

  // US Social Security Numbers
  {
    label: "US Social Security Number",
    pattern: /\b\d{3}-\d{2}-\d{4}\b/,
  },

  // Phone numbers (US / international)
  {
    label: "Phone number",
    pattern: /(?:\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/,
  },

  // IPv4 addresses (excluding 0.x.x.x, 127.x.x.x, 10.x.x.x, 192.168.x.x, 172.16-31.x.x)
  {
    label: "IPv4 address",
    pattern:
      /\b(?!0\.)(?!127\.)(?!10\.)(?!192\.168\.)(?!172\.(?:1[6-9]|2\d|3[01])\.)(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/,
  },
];

export const API_KEY_PATTERNS: InfoLeakPattern[] = [
  // AWS
  { label: "AWS Access Key", pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { label: "AWS Secret Key", pattern: /\b[A-Za-z0-9/+=]{40}\b/ },

  // Stripe
  { label: "Stripe live secret key", pattern: /\bsk_live_[0-9a-zA-Z]{24,}\b/ },
  { label: "Stripe live publishable key", pattern: /\bpk_live_[0-9a-zA-Z]{24,}\b/ },

  // GitHub
  { label: "GitHub personal access token", pattern: /\bghp_[0-9a-zA-Z]{36}\b/ },
  { label: "GitHub OAuth token", pattern: /\bgho_[0-9a-zA-Z]{36}\b/ },
  { label: "GitHub fine-grained PAT", pattern: /\bgithub_pat_[0-9a-zA-Z_]{22,}\b/ },

  // Google
  { label: "Google API key", pattern: /\bAIza[0-9A-Za-z_-]{35}\b/ },

  // Slack
  { label: "Slack bot token", pattern: /\bxoxb-[0-9]{10,}-[0-9a-zA-Z-]+\b/ },
  { label: "Slack webhook URL", pattern: /hooks\.slack\.com\/services\/T[0-9A-Z]+\/B[0-9A-Z]+\/[0-9a-zA-Z]+/ },

  // Generic long hex secrets (e.g. 32+ hex chars labelled as key/secret/token in context)
  { label: "Generic hex secret", pattern: /(?:key|secret|token|password|credential)["']?\s*[:=]\s*["']?[0-9a-f]{32,}["']?/i },

  // Private keys
  { label: "RSA/PEM private key", pattern: /-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----/ },
];

// ── Source-map detection ───────────────────────────────────────────

export const SOURCE_MAP_COMMENT_PATTERN =
  /\/\/[#@]\s*sourceMappingURL\s*=\s*(\S+)/;
