# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start all apps (web + tester) via Turborepo
npm run dev:web          # Start only the web app
npm run build            # Build all packages
npm run check-types      # TypeScript type checking across monorepo
npm run check            # Oxlint + Oxfmt (lint and format)
npm run deploy           # Deploy web to Cloudflare via Alchemy
npm run destroy          # Tear down Cloudflare deployment
```

**Per-app dev (from app directory):**

- `apps/tester`: `tsx watch src/index.ts` (port 3002)
- `apps/web`: `next dev --port 3002` (via `npm run dev:bare`)

## Architecture

**Monorepo** using npm workspaces + Turborepo. All packages use `@full-tester/*` scope.

### Apps

- **`apps/web`** — Next.js 16 full-stack app (React 19, TailwindCSS 4, shadcn/ui). Deployed to Cloudflare Workers via OpenNext. Dev runs on port 3001 (via Alchemy) or 3002 (bare).
- **`apps/tester`** — Express 5 API for domain crawling/testing. Uses Playwright for headless browser automation and AI SDK (Groq) for analysis. Port 3002.

### Packages

- **`packages/api`** — tRPC router layer. `publicProcedure` and `protectedProcedure` (session-gated). The `appRouter` and `AppRouter` type are exported from `routers/index.ts`.
- **`packages/auth`** — Better-Auth config with MongoDB adapter and Polar payment plugin.
- **`packages/db`** — Mongoose models and MongoDB connection. Auth-related schemas (user, session, account, verification).
- **`packages/env`** — Typed environment variables via `@t3-oss/env-core`. Separate configs: `server.ts` (web backend), `web.ts` (web client), `tester.ts` (tester app).
- **`packages/config`** — Shared `tsconfig.base.json`.
- **`packages/infra`** — Alchemy deployment config for Cloudflare Workers with secret bindings.

### Key Patterns

- **tRPC end-to-end types**: The web app imports `AppRouter` from `@full-tester/api` and creates a typed client. API routes live in `packages/api/src/routers/`.
- **Tester module structure**: Feature modules in `apps/tester/src/modules/<name>/` with `index.ts` (Express router), `types.ts`, core logic file, and `utils/` subdirectory.
- **Environment validation**: All env vars are validated at runtime with Zod via `@t3-oss/env-*`. Import from `@full-tester/env/<config>`.
- **ESM throughout**: All packages use `"type": "module"`. Use `.js` extensions in relative imports within the tester app.
