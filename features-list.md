# Features List

## API CHECKS

### Static HTTP Checks

1. **Status Codes Check** — Analyzes HTTP response status codes. Flags 5xx as errors (server failures), 4xx as warnings, and null status as failed requests indicating network errors or timeouts.
   - **3 checks** per URL (null status, 5xx, 4xx)

2. **Response Headers Check** — Validates presence and configuration of security headers on document responses: `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `Content-Security-Policy`, `Referrer-Policy`, `Permissions-Policy`, `X-Permitted-Cross-Domain-Policies`, `Cross-Origin-Embedder-Policy`, `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`.
   - **10 security headers** checked per document response

3. **HTTPS Check** — Flags URLs using `http://` instead of `https://`, identifying insecure connections that should be encrypted.
   - **1 check** per URL

4. **Auth Headers Check** — Detects sensitive authentication headers (`Authorization`, `Cookie`, `Set-Cookie`) transmitted over non-HTTPS connections, exposing credentials to interception.
   - **3 headers** checked per HTTP URL

### Cookie Security

5. **Cookie Security Check** — Examines `Set-Cookie` headers for missing security flags: `HttpOnly` (prevents XSS access), `Secure` (HTTPS-only), `SameSite` (CSRF prevention). Validates `SameSite=None` requires `Secure`. Applies different severity levels for auth/session cookies vs regular cookies.
   - **4 checks** per cookie (HttpOnly, Secure, SameSite, SameSite=None+Secure misconfiguration)
   - 21 regex patterns used to identify auth/session cookies (affects severity)

### Information Disclosure

6. **Sensitive Data Check** — Multi-phase comprehensive information disclosure detection:
   - **Static analysis (per URL):**
     - 20 sensitive query parameter names checked
     - 7 version-disclosing header names checked
     - 34 response body patterns: 7 stack trace, 8 framework, 8 internal path, 6 database error, 6 debug mode
     - 5 PII patterns (email, credit card w/ Luhn, SSN, phone, IP) + 9 API key patterns (AWS, Stripe, GitHub, Google, Slack, generic, private keys)
     - 1 source map comment pattern
   - **Active probing (per-origin):**
     - 6 malformed JSON payloads
     - 4 wrong content-type probes
     - 6 error-triggering path probes
     - 4 corrupted parameter probes
     - 2 source map file probes
   - **Total: ~80+ detection patterns static, 22 active probes per origin**

### Injection Attacks

7. **SQL Injection Check** — Injects SQL payloads into query parameters, POST body fields, URL path segments, and HTTP headers. Detects error patterns for MySQL, PostgreSQL, Oracle, SQLite, MSSQL, BigQuery, Cassandra, and DB2.
   - **62 payloads** (15 boolean-based, 6 union-based, 7 error-based, 3 stacked queries, 6 polyglot, 6 WAF bypass, 2 insert context, 2 wide byte, 5 BigQuery, 4 Cassandra, 6 DB2)
   - **87 detection regex patterns** across 9 database engines
   - **4 injection point types** (query params, body fields, URL path, 9 headers)
   - ~248 tests per URL

8. **XSS (Cross-Site Scripting) Check** — Tests for reflected XSS by injecting payloads into query params, body fields, URL paths, and headers. Flags responses where payloads appear unescaped in the response body.
   - **76 payloads** (6 script tags, 15 event handlers, 12 SVG/MathML, 6 attribute escapes, 5 JS protocol, 6 encoded, 8 WAF bypass, 10 template injection, 5 polyglot, 3 DOM-based)
   - **4 injection point types** (query params, body fields, URL path, 9 headers)
   - ~304 tests per URL

9. **DOM XSS Check** — Static analysis of JavaScript for dangerous data flows from sources (`location`, `URL`, `hash`, `search`, `postMessage`, `localStorage`, `URLSearchParams`) to sinks (`innerHTML`, `eval`, `document.write`, `setTimeout`, `location` assignments, jQuery `.html()`).
   - **13 source patterns** (9 location-based, 2 web messaging, 2 storage)
   - **15 sink patterns** (5 HTML injection, 4 code execution, 4 navigation, 2 jQuery)
   - 195 source-sink combinations checked per response (passive, no active injection)

10. **Command Injection Check** — Tests for OS command injection by injecting shell payloads into query params, body fields, URL paths, and headers. Detects command output patterns (uid/gid, directory listings, system info) in responses.
    - **67 payloads** (8 echo-Unix, 4 echo-Windows, 7 id-Unix, 5 /etc/passwd, 3 uname, 3 ls, 4 whoami, 3 dir, 3 win.ini, 11 WAF bypass-Unix, 5 WAF bypass-Windows)
    - **~15 detection pattern categories** (1-2 regex per payload)
    - **4 injection point types** (query params, body fields, URL path, 9 headers)
    - ~268 tests per URL

11. **NoSQL Injection Check** — Tests for NoSQL injection targeting MongoDB, Redis, DynamoDB, and Elasticsearch: `$where` injection, operator injection (`$ne`, `$gt`, `$regex`), JSON operator payload substitution, bracket notation injection, Redis CRLF/Lua injection, DynamoDB expression injection, Elasticsearch query DSL and script injection.
    - **35 base payloads** (5 MongoDB $where, 6 syntax-breaking, 4 operator strings, 4 Redis CRLF, 2 Redis Lua, 2 DynamoDB, 4 ES query DSL, 2 ES script)
    - **8 JSON operator payloads** ($ne, $gt, $gte, $regex, $in, $nin, $exists, $ne null) per body field
    - **5 bracket notation operators** ($ne, $gt, $gte, $regex, $exists) per query param
    - **37 detection regex patterns** across 4 NoSQL engines (8 MongoDB, 7 Redis, 7 DynamoDB, 7 Elasticsearch)
    - **4 base + 2 specialized injection point types**
    - 140+ base tests per URL (variable with operator/bracket multiplication)

12. **SSTI (Server-Side Template Injection) Check** — Injects template expression payloads to detect server-side template injection across engines: Jinja2, Twig, FreeMarker, ERB, EJS, Nunjucks, Pug/Jade, Thymeleaf, Smarty, Velocity, Mako, Handlebars. Detects mathematical expression evaluation and command execution patterns.
    - **26 payloads** (1 polyglot, 4 Jinja2, 4 Twig, 3 FreeMarker, 2 ERB, 2 EJS, 3 Nunjucks, 1 Pug/Jade, 2 Thymeleaf, 2 Smarty, 1 Velocity, 2 Mako, 1 Handlebars)
    - **~60 payload-specific detection patterns** + 14 engine-specific error patterns
    - **4 injection point types** (query params, body fields, URL path, 9 headers)
    - ~104 tests per URL

### Network & Protocol Attacks

13. **SSRF (Server-Side Request Forgery) Check** — Injects internal/metadata URLs into query params, body fields, and headers. Probes for cloud metadata endpoints (AWS EC2 IMDSv1, GCP, Azure, DigitalOcean, Alibaba Cloud, Oracle Cloud), internal services (Elasticsearch, Redis, Consul, Docker API, Kubelet), and localhost/metadata IP bypasses (octal, decimal, hex, IPv6, shorthand notations).
    - **27 SSRF URL payloads** (3 AWS, 2 GCP, 2 Azure, 1 DigitalOcean, 1 Alibaba, 1 Oracle, 5 internal services, 6 localhost bypasses, 3 metadata IP bypasses, 3 URL encoding bypasses)
    - **36 detection regex patterns** (cloud-specific response markers per provider)
    - **3 injection point types** (query params, body fields, 9 headers — URL path skipped)
    - ~81 tests per URL (× number of injectable params)

14. **CORS Misconfiguration Check** — Sends crafted `Origin` headers to detect CORS misconfigurations: reflected origin vulnerability, null origin acceptance, wildcard with credentials, improper `Access-Control-Allow-Credentials: true` handling.
    - **2 probe origins** (evil origin, null origin)
    - **3 misconfiguration detection types** (reflected origin, null acceptance, wildcard + credentials)
    - Per-origin deduplication

15. **Open Redirect Check** — Tests redirect-like parameters (`redirect`, `return`, `next`, `callback`, `url`, `destination`, etc.) with external URL payloads. Uses bypass techniques (double slashes, protocol-relative, whitespace, encoded characters). Monitors 3xx responses with Location headers pointing to attacker-controlled domains.
    - **8 redirect payloads** per parameter (direct URL, protocol-relative, trailing slash, backslash bypass, @-sign, query string, fragment, null byte)
    - **32 redirect parameter names** matched (next, url, redirect, redirect_url, return, returnto, dest, goto, callback, etc.)
    - **2 injection point types** (query params, body fields)
    - 8 × N candidate parameters tests per URL

### API Security

16. **HTTP Method Tampering Check** — Tests GET endpoints by attempting PUT, DELETE, and PATCH requests. Flags unexpected 2xx responses indicating the server accepts unauthorized methods that could allow state changes.
    - **3 HTTP methods** tested (PUT, DELETE, PATCH)
    - Per-canonical-URL deduplication

17. **JWT Analysis Check** — Extracts and analyzes JWT tokens from headers, cookies, query params, and body:
    - **Header analysis:** `alg: none` (4 variants), embedded JWK, `jku`/`x5u` URL attacks, `kid` path traversal, algorithm confusion — **6 check types**
    - **Claims analysis:** Missing `exp`, expired token, excessive lifetime (>30 days), missing `iat`, premature `nbf` — **5 check types**
    - **Weak secret cracking:** **87 common/default secrets** tested against HMAC algorithms
    - **Algorithm confusion:** 2 test types (asymmetric-to-HMAC re-signing)
    - **7 JWT extraction locations** (Authorization header, all request headers, cookies, response headers, query params, request body, response body)
    - Per-token deduplication

### File & Path Exposure

18. **Predefined URLs Check** — Probes for exposed sensitive files and endpoints across categories (per-domain deduplication):
    - **178 unique URL paths** probed per domain:
      - Environment & secrets: 9 paths
      - Version control: 5 paths
      - Package files: 8 paths
      - Debug & admin panels: 13 paths
      - Server information: 15 paths
      - Backup files: 5 paths
      - Infrastructure config: 4 paths
      - Source maps: 3 paths
      - Log files: 5 paths
      - Path traversal / LFI: 105 paths (multiple encoding variants)
      - Well-known endpoints: 6 paths
    - **241+ detection regex patterns** (0-4 body patterns per path)

---

### Totals

| Category | Checks | Payloads / Patterns | Max Tests per URL |
|----------|--------|--------------------|--------------------|
| Static HTTP | 4 | 17 checks | 17 |
| Cookie Security | 1 | 4 checks per cookie | 4 per cookie |
| Sensitive Data | 1 | 80+ static patterns, 22 active probes | 80+ static, 22 per origin |
| SQL Injection | 1 | 62 payloads, 87 detection patterns | ~248 |
| XSS (Reflected) | 1 | 76 payloads | ~304 |
| DOM XSS | 1 | 13 sources × 15 sinks | 195 (passive) |
| Command Injection | 1 | 67 payloads | ~268 |
| NoSQL Injection | 1 | 35 base + 13 operator payloads, 37 detection patterns | 140+ |
| SSTI | 1 | 26 payloads, 74 detection patterns | ~104 |
| SSRF | 1 | 27 payloads, 36 detection patterns | ~81 × params |
| CORS | 1 | 2 probes, 3 detection types | 2 per origin |
| Open Redirect | 1 | 8 payloads, 32 param names | 8 × params |
| HTTP Method Tampering | 1 | 3 methods | 3 |
| JWT Analysis | 1 | 87 secrets, 13 analysis checks | 100 per token |
| Predefined URLs | 1 | 178 paths, 241+ detection patterns | 178 per domain |

**Grand total: 18 checks, 590+ unique payloads, 575+ detection patterns, ~1,500+ potential tests per URL**
