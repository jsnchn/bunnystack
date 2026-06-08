# Bunnystack

[![Use this template](https://img.shields.io/badge/Use%20this%20template-2ea44f?style=for-the-badge&logo=github)](https://github.com/new?template_name=bunnystack&template_owner=jsnchn)

A Bun-powered multi-domain monorepo starter template built with Turborepo. Ships
with a full-stack foundation — ElysiaJS backend, React + Vite frontend, Drizzle
ORM on PostgreSQL, and Better-Auth for authentication — plus stubs for React
Native and Electron apps.

---

## Quick Start

For someone who just cloned the repo:

```bash
git clone git@github.com:jsnchn/bunnystack.git my-project
cd my-project
bun install
docker compose up -d db
cp .env.example .env
bun run db:migrate
bun run dev
```

The API server starts on **http://localhost:3000** and the web app on
**http://localhost:5173**.

---

## What's in the Box

| App / Package | Purpose | Tech |
|---|---|---|
| `apps/api` | Backend API server — routes, auth middleware, health check | Bun, ElysiaJS |
| `apps/web` | Frontend SPA — login, signup, dashboard pages | React 19, Vite 6, Tailwind v4, react-router v7 |
|| `apps/mobile` | React Native mobile app — Expo with EAS Build for app store deployment | React Native, Expo |
|| `apps/desktop` | Electron desktop app — packaging for Win/Mac/Linux via electron-builder | Electron, electron-builder |
| `packages/db` | Database schema, migrations, and client | Drizzle ORM, postgres |
| `packages/auth` | Authentication configuration with Better-Auth | Better-Auth, Drizzle adapter |
| `packages/config` | Shared TypeScript configs and environment validation | tsconfig files, env helper |

---

## Project Structure

```
bunnystack/
├── apps/
│   ├── api/                  # ElysiaJS backend (port 3000)
│   │   ├── src/
│   │   │   └── index.ts      # Server entry, auth mount, routes
│   │   └── package.json
│   ├── web/                  # React + Vite SPA (port 5173)
│   │   ├── src/
│   │   │   ├── pages/        # Login, SignUp, Dashboard
│   │   │   ├── lib/          # API client helpers
│   │   │   └── App.tsx       # Router setup
│   │   └── package.json
│   ├── mobile/               # React Native + Expo
│   │   ├── App.tsx            # Expo entry component
│   │   ├── app.json           # Expo config (iOS/Android identifiers)
│   │   ├── eas.json           # EAS Build profiles
│   │   └── package.json
│   ├── desktop/              # Electron + electron-builder
│   │   ├── src/
│   │   │   ├── main.ts       # Electron main process
│   │   │   └── preload.ts    # Context bridge
│   │   ├── electron-builder.yml  # Packaging config
│   │   └── package.json
├── packages/
│   ├── db/                   # Drizzle ORM
│   │   ├── src/
│   │   │   ├── schema.ts     # Table definitions
│   │   │   └── index.ts      # DB client export
│   │   ├── drizzle.config.ts # Drizzle Kit config
│   │   └── package.json
│   ├── auth/                 # Better-Auth
│   │   ├── src/
│   │   │   └── auth.ts       # Auth config (email/password + Google SSO)
│   │   └── package.json
│   └── config/               # Shared configs
│       ├── tsconfig/         # base.json, api.json, web.json
│       ├── src/
│       │   └── env.ts        # Env validation helper
│       └── package.json
├── .codegraph/               # CodeGraph index configuration
├── .github/workflows/        # CI + Deploy GitHub Actions
│   ├── ci.yml                # Type-check + build on PR
│   └── deploy.yml            # Deploy to Fly.io on push to main
├── docker-compose.yml        # PostgreSQL 17
├── Dockerfile                # Multi-stage Bun build for Fly.io
├── fly.toml                  # Fly.io deployment config
├── .env.example              # Environment variable template
├── agents.md                 # AI agent orientation guide
├── turbo.json                # Turborepo task definitions
└── package.json              # Root scripts and workspace config
```

---

## Prerequisites

- **Bun** 1.3+ — Install: `curl -fsSL https://bun.sh/install | bash`
- **Docker** — Required for running PostgreSQL locally via Docker Compose
- **Git** — For cloning and version control

---

## Available Scripts

All commands are run from the project root.

### Root-level scripts (bun run <script>)

| Script | Description |
|---|---|
| `bun run dev` | Start all apps in dev mode (API on :3000, Web on :5173) |
| `bun run build` | Build all packages to `dist/` |
| `bun run check-types` | Type-check all packages |
| `bun run lint` | Lint all packages |
| `bun run format` | Auto-format all TypeScript/Markdown files with Prettier |
| `bun run db:up` | Start PostgreSQL (`docker compose up -d db`) |
| `bun run db:down` | Stop PostgreSQL (`docker compose down`) |
| `bun run db:generate` | Generate a new Drizzle migration |
| `bun run db:migrate` | Apply pending migrations |
| `bun run db:studio` | Launch Drizzle Studio GUI |
| `bun run dev:with-tunnel` | Start dev servers with Cloudflare Tunnel (optional) |
| `bun run tunnel:setup` | One-time: authenticate Cloudflare, create tunnel, route DNS |
| `bun run tunnel:up` | Start the tunnel container |
| `bun run tunnel:down` | Stop the tunnel container |
| `bun run tunnel:logs` | View tunnel logs |

### Per-package scripts (bun run --filter <pkg> <script>)

| Package | Script | Description |
|---|---|---|
| `@bunnystack/db` | `bun run --filter @bunnystack/db generate` | Generate Drizzle migration |
| `@bunnystack/db` | `bun run --filter @bunnystack/db migrate` | Apply Drizzle migration |
| `@bunnystack/db` | `bun run --filter @bunnystack/db push` | Push schema directly (dev only) |
| `@bunnystack/db` | `bun run --filter @bunnystack/db studio` | Open Drizzle Studio |
| `api` | `bun run --filter api dev` | Start API in watch mode |
| `api` | `bun run --filter api build` | Build API for production |
| `api` | `bun run --filter api start` | Start built API server |
| `web` | `bun run --filter web dev` | Start Vite dev server |
| `web` | `bun run --filter web build` | Build web for production |
| `web` | `bun run --filter web preview` | Preview production build |
| `mobile` | `bun run --filter mobile start` | Start Expo dev server |
| `mobile` | `bun run --filter mobile deploy` | EAS Build + submit to stores |
| `desktop` | `bun run --filter desktop start` | Launch Electron app |
| `desktop` | `bun run --filter desktop dist` | Package for current platform |
| `desktop` | `bun run --filter desktop deploy` | Package + publish |

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgres://bunnystack:***@localhost:5432/bunnystack` | PostgreSQL connection string |
| `PORT` | `3000` | Port for the API server |
| `BETTER_AUTH_SECRET` | _(none — required)_ | Secret key for Better-Auth session signing |
|| `BETTER_AUTH_URL` | `http://localhost:3000` | Public URL for Better-Auth callbacks |
| `GOOGLE_CLIENT_ID` | _(none — placeholder)_ | Google OAuth client ID (from Google Cloud Console) |
| `GOOGLE_CLIENT_SECRET` | _(none — placeholder)_ | Google OAuth client secret (from Google Cloud Console) |
| `NODE_ENV` | `development` | Environment mode (`development`, `production`, `test`) |

### Tunnel vars

| Variable | Default | Description |
|---|---|---|
| `TUNNEL_SUBDOMAIN` | _(none — required)_ | Subdomain prefix: `<name>.jsnchn.net` |
| `TUNNEL_NAME` | `bunnystack-tunnel` | cloudflared tunnel name (for DNS routing) |

### Production secrets (Fly.io)

When deploying, set these with `fly secrets set`:

```bash
fly secrets set DATABASE_URL="<production-db-url>"
fly secrets set BETTER_AUTH_SECRET="<long-random-string>"
fly secrets set BETTER_AUTH_URL="https://my-app.fly.dev"
```

---

## Development Workflow

### Working on API and Web simultaneously

```bash
bun run dev
```

This starts both the Elysia API server (with `--watch` for hot reload) and the
Vite dev server concurrently via Turborepo. The Vite dev server proxies `/api/*`
requests to the backend, so your frontend can call `fetch("/api/auth/...")`
without CORS issues in development.

### Adding a new API route

Open `apps/api/src/index.ts` and add a new route:

```typescript
app.get("/api/hello", () => "Hello, world!");

// Or with a plugin
app.group("/api/items", (app) =>
  app
    .get("/", () => db.select().from(items))
    .post("/", (ctx) => db.insert(items).values(ctx.body))
);
```

For larger route collections, extract a plugin to a separate file:

```typescript
// apps/api/src/routes/items.ts
import { Elysia } from "elysia";
import { db } from "@bunnystack/db";

export const itemsRoutes = new Elysia().get("/api/items", () =>
  db.select().from(items)
);

// In index.ts
app.use(itemsRoutes);
```

### Modifying the database schema

1. Edit `packages/db/src/schema.ts` — add or modify tables with Drizzle syntax.
2. Generate a migration:
   ```bash
   bun run db:generate
   ```
3. Review the generated SQL in `packages/db/drizzle/`.
4. Apply the migration:
   ```bash
   bun run db:migrate
   ```

### Type-checking

Run type checks across the entire monorepo:

```bash
bun run check-types
```

Turborepo caches results — only changed packages re-check.

---

## Deployment

### API + Web (Fly.io — primary)

The included `Dockerfile` builds both the API binary and web static assets into a
single production image. The Elysia server serves the web frontend at `/` via
`@elysiajs/static`, so a single Fly.io app handles both layers.

**One-time setup:**

```bash
# Install flyctl
curl -fsSL https://fly.io/install.sh | sh

# Log in (creates account if needed)
fly auth login

# Launch the app (creates fly.toml if not already present)
fly launch --image oven/bun:1

# Set production secrets
fly secrets set DATABASE_URL="<your-production-postgres-url>"
fly secrets set BETTER_AUTH_SECRET="***"
fly secrets set BETTER_AUTH_URL="https://your-app.fly.dev"
fly secrets set GOOGLE_CLIENT_ID="***"
fly secrets set GOOGLE_CLIENT_SECRET="***"
```

**Deploy:**

```bash
fly deploy
```

**GitHub Actions (automatic) —** The included CI/CD workflows handle:

- **CI** (`.github/workflows/ci.yml`) — Runs `check-types` and `build` on every PR.
- **Deploy** (`.github/workflows/deploy.yml`) — Runs `fly deploy` on push to `main`.
  For this to work, set `FLY_API_TOKEN` as a GitHub Actions secret.

---

### Mobile (Expo + EAS Build)

Deploy to iOS App Store and Google Play via Expo's EAS Build service.

```bash
# One-time
cd apps/mobile
bun run deploy    # Builds and submits to both stores
```

Configure `apps/mobile/eas.json` with your Apple ID and Google Play credentials.
See the [EAS Build docs](https://docs.expo.dev/build/introduction/) for details.

---

### Desktop (electron-builder)

Package for Windows (NSIS), macOS (DMG), and Linux (AppImage/deb).

```bash
cd apps/desktop

# Package for current platform
bun run dist

# Package for all platforms
bun run dist -- --win --mac --linux
```

Output goes to `apps/desktop/dist/`. Configure signing and notarization in
`apps/desktop/electron-builder.yml`. See the
[electron-builder docs](https://www.electron.build/) for details.

---

## Cloudflare Tunnel (Optional)

The project includes an optional Cloudflare Tunnel for receiving webhooks and
sharing your local dev environment over a public URL during development.

### One-time setup

```bash
# 1. Install cloudflared (if not already installed)
brew install cloudflared         # macOS
sudo apt install cloudflared      # Debian/Ubuntu

# 2. Set your subdomain in .env
echo "TUNNEL_SUBDOMAIN=myproject" >> .env

# 3. Run the setup script
bun run tunnel:setup
```

This authenticates with Cloudflare, creates a tunnel, and routes DNS so
`https://myproject.jsnchn.net` points to your local dev environment.

### Daily usage

```bash
# Start with tunnel
bun run dev:with-tunnel

# Or separately:
bun run dev               # in one terminal
bun run tunnel:up         # in another

# Visit
open https://myproject.jsnchn.net

# Stop tunnel
bun run tunnel:down
```

### How it works

The tunnel runs as a Docker container (`cloudflare/cloudflared:latest`) defined in
`docker-compose.tunnel.yml`. It uses host networking to reach your local dev servers
directly:

- Requests to `/api/*` are proxied to Elysia on **localhost:3000**
- All other requests go to Vite on **localhost:5173**

The tunnel shares the same hostname for both web and API, so requests are
same-origin — no CORS issues. For Better-Auth to generate correct redirects,
set `BETTER_AUTH_URL` to your tunnel URL in `.env`.

---

## AI Tooling

### agents.md

The `agents.md` file at the project root is an AI agent orientation guide. It
provides a concise summary of the project (runtime, structure, commands, and
conventions) so that AI coding tools like Claude Code, Cursor, Copilot, and
Codex CLI can understand the codebase with minimal token cost.

Open it and review before asking an AI to make changes.

### CodeGraph

This project uses [CodeGraph](https://codegraph.sh) for code intelligence.
CodeGraph indexes the codebase and provides symbol search, context building,
and impact analysis.

**Setup for new clones:**

```bash
npm install -g @colbymchenry/codegraph   # Install (one-time)
codegraph init -i                         # Initialize + index
```

**Usage during development:**

```bash
codegraph status           # Check index status
codegraph sync             # Sync changes after editing
codegraph context <task>   # Build markdown context for an AI task
codegraph query <symbol>   # Find symbol definitions and references
codegraph callers <fn>     # Find callers of a function
codegraph impact <symbol>  # Analyze change impact
```

---

## Creating a New Project

Follow this checklist to spin up a new project from the template:

1. **Clone and enter**
   ```bash
   git clone git@github.com:jsnchn/bunnystack.git my-project
   cd my-project
   ```

2. **Remove the existing git history** (optional — start fresh)
   ```bash
   rm -rf .git
   git init
   git add .
   git commit -m "Initial commit"
   ```

3. **Install dependencies**
   ```bash
   bun install
   ```

4. **Initialize CodeGraph** (optional)
   ```bash
   npm install -g @colbymchenry/codegraph
   codegraph init -i
   ```

5. **Start the database**
   ```bash
   docker compose up -d db
   ```

6. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your values (especially BETTER_AUTH_SECRET)
   ```

7. **Run migrations**
   ```bash
   bun run db:migrate
   ```

8. **Start developing**
   ```bash
   bun run dev
   ```

9. **Customize the app name** in `fly.toml`, `package.json`, and any branding.

10. **Push to your own repository** and set up GitHub secrets for CI/CD.

---

## Architecture Conventions

- **Imports**: Internal packages use workspace protocol (`@bunnystack/db`,
  `@bunnystack/auth`). Never import across apps directly.
- **API design**: Routes go in `apps/api/src/index.ts` or in extracted plugins.
  Auth routes live at `/api/auth/*` (handled by Better-Auth). Health check at
  `GET /api/health`.
- **Database**: Schema lives in `packages/db/src/schema.ts`. Always generate
  migrations for production; use `push` only in development.
- **Auth**: Configured in `packages/auth/src/auth.ts`. Email/password + Google SSO
  enabled by default. Google sign-in redirects to `/api/auth/sign-in/google`.
- **Frontend**: Vite proxies `/api/*` to the backend in dev mode. Pages go in
  `apps/web/src/pages/`. API client helpers go in `apps/web/src/lib/`.
- **TypeScript**: Strict mode always. Prefer `unknown` + type guards over `any`.

---

## Contributing

Contributions are welcome! Please follow these guidelines:

- Use conventional commits (`feat:`, `fix:`, `chore:`, `docs:`).
- Run `bun run check-types` and `bun run build` before opening a PR.
- Keep PRs focused on a single concern.

## License

MIT