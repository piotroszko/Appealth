# Full Tester

A comprehensive website testing, security analysis, and monitoring platform built as a TypeScript monorepo. Crawl domains, run 20+ automated security checks, validate HTML, analyze DNS and SSL/TLS configurations, track broken links, and monitor uptime — all from a single dashboard.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TailwindCSS 4, shadcn/ui |
| Backend (web) | tRPC v11, Next.js API routes |
| Backend (tester) | Express 5, Playwright |
| Database | MongoDB, Mongoose 8 |
| Auth | Better-Auth, Polar payments |
| AI | AI SDK (Groq) |
| Deployment | Cloudflare Workers (OpenNext + Alchemy) |
| Monorepo | npm workspaces, Turborepo |
| Linting/Formatting | Oxlint, Oxfmt |
| Language | TypeScript 5 (ESM throughout) |

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- MongoDB instance (local or Atlas)
- Playwright browsers (`npx playwright install`)

### Installation

```bash
npm install
```

### Environment Variables

The project uses typed, Zod-validated environment variables via `@t3-oss/env-core`. There are three separate configs:

| Config | File | Used by |
|---|---|---|
| `@full-tester/env/server` | `packages/env/src/server.ts` | Web app backend (tRPC, API routes) |
| `@full-tester/env/web` | `packages/env/src/web.ts` | Web app client (Next.js public vars) |
| `@full-tester/env/tester` | `packages/env/src/tester.ts` | Tester Express API |

Create `.env` files in:

- `apps/web/.env` — MongoDB URI, auth secrets, Polar keys
- `apps/tester/.env` — MongoDB URI, Google API key, Groq API key
- `packages/infra/.env` — Cloudflare secrets for deployment

### Running Development

```bash
# Start all apps (web + tester) via Turborepo
npm run dev

# Start only the web app
npm run dev:web
```

The web app runs on **port 3001** (via Alchemy) or **port 3002** (bare `next dev`). The tester API runs on **port 3002**.

## Project Structure

```
full-tester/
├── apps/
│   ├── web/                    # Next.js full-stack dashboard
│   │   ├── src/
│   │   │   ├── app/            # App router pages
│   │   │   │   ├── dashboard/  # Main dashboard
│   │   │   │   ├── login/      # Authentication
│   │   │   │   ├── success/    # Payment success
│   │   │   │   └── api/        # tRPC + auth API routes
│   │   │   ├── components/     # React components + shadcn/ui
│   │   │   ├── lib/            # Auth client, utilities
│   │   │   └── utils/          # tRPC client setup
│   │   └── next.config.ts
│   │
│   └── tester/                 # Express API — crawling & testing engine
│       └── src/
│           ├── index.ts        # Server entry, route mounting, cron jobs
│           └── modules/        # Feature modules (see below)
│
├── packages/
│   ├── api/                    # tRPC router layer (public + protected procedures)
│   ├── auth/                   # Better-Auth config, MongoDB adapter, Polar payments
│   ├── db/                     # Mongoose models and MongoDB connection
│   ├── env/                    # Zod-validated env vars (server, web, tester)
│   ├── config/                 # Shared tsconfig.base.json
│   └── infra/                  # Alchemy deployment config for Cloudflare Workers
│
├── turbo.json                  # Turborepo task definitions
├── .oxlintrc.json              # Oxlint config
├── .oxfmtrc.json               # Oxfmt config
└── package.json                # Root workspace
```

## Tester Modules

The tester API is organized into feature modules under `apps/tester/src/modules/`. Each module follows a consistent structure: `index.ts` (Express router), `types.ts`, core logic, and optional `checks/` or `utils/` subdirectories.

### Domain Crawling

**`/crawl`** — Crawls a domain using Playwright to discover pages, endpoints, and resources.

### API Security Testing

**`/api-tester`** — Runs 20+ automated security checks against discovered endpoints. Checks are organized by category:

| Category | Checks |
|---|---|
| Static Analysis | Response headers, HTTPS enforcement, status codes, auth headers |
| Injection | SQL injection, NoSQL injection, command injection, SSTI |
| Cross-Site Scripting | Reflected XSS, DOM-based XSS |
| Authentication | JWT analysis, cookie security |
| Access Control | CORS misconfiguration, open redirect, SSRF |
| Data Exposure | Sensitive data patterns, HTTP method tampering |
| Predefined URLs | Common sensitive paths and endpoints |

Results are stored using a bucketing strategy in MongoDB for query efficiency.

### DNS Health Check

**`/dns`** — Comprehensive DNS analysis:

- DNS record enumeration
- DNSSEC validation
- Nameserver health
- Email security (SPF, DKIM, DMARC)
- Misconfiguration detection
- Response quality metrics
- Reverse DNS lookups

### SSL/TLS Analysis

**`/ssl-tls`** — TLS configuration validation:

- Certificate validity and chain verification
- Cipher suite analysis
- Protocol version checks (TLS 1.2/1.3)
- HSTS header validation
- CAA record validation

### HTML Validation

**`/html-validator`** — Validates HTML using the VNU validator (W3C Nu Html Checker).

### PageSpeed Insights

**`/pageinsights`** — Integrates with the Google PageSpeed Insights API for performance, accessibility, SEO, and best practices audits.

### Broken Link Detection

**`/broken-links`** — Scans pages for broken internal and external links. Runs on a scheduled cron job.

### Uptime Monitoring

**`/monitor`** — Periodic health checks on monitored pages. Tracks response times and availability via cron job.

## Packages

### `@full-tester/api`

tRPC router layer providing `publicProcedure` and `protectedProcedure` (session-gated). Exports `appRouter` and `AppRouter` type for end-to-end type safety between the web app and API.

### `@full-tester/auth`

Better-Auth configuration with MongoDB adapter and Polar payment plugin for subscription management.

### `@full-tester/db`

Mongoose models and MongoDB connection. Models include:

- `auth.model` — User, session, account, verification schemas
- `api-test-request.model` / `api-test-result.model` — API test tracking
- `broken-links-test-request.model` / `broken-link-result-bucket.model` — Broken link results
- `monitored-page.model` / `monitor-result-bucket.model` — Uptime monitoring
- `network-request-bucket.model` — Network request storage

### `@full-tester/env`

Typed environment variables using `@t3-oss/env-core` with Zod validation. Three separate configs for web server, web client, and tester app.

### `@full-tester/config`

Shared `tsconfig.base.json` with strict mode, ESNext target, and bundler module resolution.

### `@full-tester/infra`

Alchemy-based infrastructure-as-code for deploying the web app to Cloudflare Workers with secret bindings.

## Available Scripts

### Root

```bash
npm run dev              # Start all apps via Turborepo
npm run dev:web          # Start only the web app
npm run build            # Build all packages
npm run check-types      # TypeScript type checking across monorepo
npm run check            # Oxlint + Oxfmt (lint and format)
npm run deploy           # Deploy web to Cloudflare via Alchemy
npm run destroy          # Tear down Cloudflare deployment
```

### Per-App

```bash
# Web (from apps/web/)
npm run dev:bare         # next dev --port 3002
npm run build            # next build

# Tester (from apps/tester/)
npm run dev              # tsx watch src/index.ts
npm run build            # tsc
```

## Deployment

The web app deploys to Cloudflare Workers using OpenNext and Alchemy.

```bash
# Deploy
npm run deploy

# Tear down
npm run destroy
```

For local development with Alchemy:

```bash
cd apps/web && npm run alchemy dev
```

See the [Cloudflare + Alchemy guide](https://www.better-t-stack.dev/docs/guides/cloudflare-alchemy) for more details.

## Key Patterns

- **tRPC end-to-end types**: The web app imports `AppRouter` from `@full-tester/api` and creates a typed client. API routes live in `packages/api/src/routers/`.
- **Tester module structure**: Feature modules in `apps/tester/src/modules/<name>/` with `index.ts` (router), `types.ts`, core logic file, and `checks/` or `utils/` subdirectories.
- **Environment validation**: All env vars are validated at runtime with Zod. Import from `@full-tester/env/server`, `@full-tester/env/web`, or `@full-tester/env/tester`.
- **ESM throughout**: All packages use `"type": "module"`. Use `.js` extensions in relative imports within the tester app.
- **Bucketed storage**: Test results use a bucketing strategy in MongoDB for efficient querying over time-series data.
- **Cron scheduling**: The tester app runs three background cron jobs for API testing, broken link detection, and uptime monitoring.
