# TODO — Security Checks

Remaining check types to implement in `apps/tester/src/modules/api-tester/checks/`.

## Injection Attacks

- [ ] **NoSQL Injection** — Inject MongoDB operators (`$gt`, `$ne`, `$regex`) into JSON body fields, detect auth bypass or data leakage

## Authentication & Authorization

- [ ] **CORS Misconfiguration** — Send requests with `Origin: https://evil.com`, flag if `Access-Control-Allow-Origin` reflects arbitrary origins
- [ ] **Open Redirect** — Inject external URLs into redirect-like params (`?next=`, `?url=`, `?redirect=`), check 3xx Location header
- [ ] **JWT Analysis** — Decode JWTs from cookies/headers, flag `alg: none`, weak signing, missing expiration, expired tokens

## API-Specific

- [ ] **HTTP Method Tampering** — Try PUT/DELETE/PATCH on endpoints that only expect GET, flag unexpected 2xx success
- [ ] **Rate Limiting** — Send rapid repeated requests, flag endpoints with no 429 response
- [ ] **Verbose Error Detection** — Flag responses that leak stack traces, framework versions, internal paths beyond what `check-sensitive-data` catches

======================================

Add test to test checks.
