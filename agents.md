# Bunnystack — AI Agent Guide

This file helps AI tools (Claude Code, Cursor, Copilot, Hermes, Codex CLI, etc.)
understand the project efficiently. Reading this first reduces token cost and
improves accuracy.

---

## Quick Facts

- **Runtime:** Bun (not Node.js)
- **Monorepo:** Turborepo with workspaces
- **Backend:** ElysiaJS (port 3000)
- **Frontend:** React + Vite (port 5173)
- **Database:** PostgreSQL + Drizzle ORM
- **Auth:** Better-Auth (email/password)
- **Deploy:** Fly.io (containers)
- **PM:** `bun` (not npm/pnpm/yarn — don't use package-lock.json or pnpm-lock.yaml)
- **TypeScript:** strict mode, bundler module resolution

---

## Project Structure

```
bunnystack/
├── apps/
│   ├── api/          # ElysiaJS backend server
│   ├── web/          # React + Vite SPA
│   ├── mobile/       # React Native (placeholder)
│   └── desktop/      # Electron (placeholder)
├── packages/
│   ├── db/           # Drizzle ORM schema + client
│   ├── auth/         # Better-Auth configuration
│   └── config/       # Shared TypeScript configs + env helpers
├── .codegraph/       # CodeGraph index config (see below)
└── turbo.json        # Turborepo task definitions
```

---

## Common Commands

```bash
bun install              # Install all dependencies (workspace-aware)
bun run dev              # Start all apps in dev mode (API on 3000, Web on 5173)
bun run build            # Build all packages to dist/
bun run check-types      # Type-check all packages
bun run lint             # Lint all packages

# Database (requires Docker)
docker compose up -d db                          # Start Postgres
bun run --filter @bunnystack/db generate         # Generate migration
bun run --filter @bunnystack/db migrate          # Apply migration
bun run --filter @bunnystack/db push             # Push schema directly
bun run --filter @bunnystack/db studio           # Open Drizzle Studio
```

---

## CodeGraph

This project uses [CodeGraph](https://codegraph.sh) for code intelligence.
CodeGraph indexes the codebase and provides symbol search, context building,
and impact analysis via MCP.

**Setup for new clones:**

```bash
npm install -g @colbymchenry/codegraph      # Install (one-time)
codegraph init -i                           # Initialize + index
```

**Usage during development:**

```bash
codegraph status              # Check index status
codegraph sync                # Sync changes after editing
codegraph context <task>      # Build markdown context for an AI task
codegraph query <symbol>      # Find symbol definitions and references
codegraph callers <fn>        # Find everything that calls a function
codegraph impact <symbol>     # Analyze change impact
```

CodeGraph is installed as an MCP server in Hermes Agent — tools like
`codegraph_query`, `codegraph_context`, and `codegraph_parse` are available.

---

## Architecture Rules

### Imports
- Internal packages use workspace protocol: `@bunnystack/db`, `@bunnystack/auth`
- Never import across apps directly — always go through the workspace package
- Shared TypeScript configs via `@bunnystack/config/tsconfig/*`

### API Design
- All routes go in `apps/api/src/index.ts` or use Elysia plugins/controllers
- Auth routes are served at `/api/auth/*` by Better-Auth
- Health check at `GET /api/health`
- CORS is enabled for local dev (Vite proxy)

### Database
- Schema lives in `packages/db/src/schema.ts`
- Always generate migrations, never push to production
- Use Drizzle relations for joins, not raw SQL
- Client is exported from `@bunnystack/db`

### Auth
- Configured in `packages/auth/src/auth.ts`
- Uses Better-Auth with Postgres adapter
- Email/password enabled by default
- Extend with OAuth plugins via Better-Auth's plugin system

### Frontend
- Vite proxies `/api/*` to the backend in dev mode
- API client should go in `apps/web/src/lib/api.ts`
- Use react-router for routing, add pages in `apps/web/src/pages/`

---

## New Project Checklist

When spinning up a new project from this template:

1. `git clone git@github.com:bunnystack/bunnystack.git my-project && cd my-project`
2. `bun install`
3. `codegraph init -i` (if not already indexed)
4. `docker compose up -d db`
5. `bun run --filter @bunnystack/db generate && bun run --filter @bunnystack/db migrate`
6. Copy `.env.example` to `.env` and fill in values
7. `bun run dev`

---

## Conventions

- **TypeScript:** strict mode always. Avoid `any`. Prefer `unknown` + type guards.
- **Formatting:** Prettier (config in root). Run `bun run format` before commits.
- **Commits:** Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`).
- **PRs:** CI runs `check-types` and `build`. Must pass before merge.
- **Testing:** Bun's built-in test runner (`bun test`). Add tests alongside source files.

---

## Cost-Saving Tips for AI Agents

- Use `codegraph context <task>` before asking for code changes — it produces
  a focused markdown context from the index, cheaper than dumping full files
- Use `codegraph query` or `codegraph callers` for targeted searches instead
  of reading entire files
- Prefer `bun run check-types` over launching the full dev server for
  verification (faster, cheaper)
- Use Turbo's cached output: `bun run check-types` only re-checks changed packages
