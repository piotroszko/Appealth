# TODO — Security Checks

Remaining check types to implement in `apps/tester/src/modules/api-tester/checks/`.

## Authentication & Authorization

- [ ] **JWT Analysis** — Decode JWTs from cookies/headers, flag `alg: none`, weak signing, missing expiration, expired tokens

## API-Specific

- [ ] **Rate Limiting** — Send rapid repeated requests, flag endpoints with no 429 response
- [ ] **Verbose Error Detection** — Flag responses that leak stack traces, framework versions, internal paths beyond what `check-sensitive-data` catches

======================================

Add test to test checks.
