# Cloudflare Tunnel for Bunnystack

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Add an optional Cloudflare Tunnel (cloudflared) to bunnystack so projects based on it can receive webhooks and serve the dev environment over a custom subdomain of `jsnchn.net`.

**Architecture:**
- `cloudflared` runs in a Docker container via a separate compose override (`docker-compose.tunnel.yml`)
- Uses a **named Cloudflare Tunnel** with ingress rules to route:
  - `<subdomain>.jsnchn.net/api/*` → host Elysia API (port 3000)
  - `<subdomain>.jsnchn.net/*` → host Vite dev server (port 5173)
- One-time setup per project: `cloudflared tunnel login` + `cloudflared tunnel create` + DNS routing
- `bun run dev:with-tunnel` launches `bun run dev` + cloudflared simultaneously

**Tech Stack:** Docker Compose override profiles, cloudflare/cloudflared:latest, host.docker.internal

---

### Task 1: Add tunnel environment variables to `.env.example`

**Objective:** Define the new env vars that projects need for tunnel configuration.

**Files:**
- Modify: `~/dev/bunnystack/.env.example` (append to end)

**Step 1: Append tunnel vars to .env.example**

Add to the end of `.env.example`:

```env
# Cloudflare Tunnel (optional — used with `bun run dev:with-tunnel`)
TUNNEL_SUBDOMAIN=myproject      # Subdomain name: <name>.jsnchn.net
TUNNEL_NAME=bunnystack-tunnel    # cloudflared tunnel name
CLOUDFLARE_ACCOUNT_TAG=          # Cloudflare account tag (from dashboard)
# TUNNEL_CREDENTIALS_FILE=.cloudflared/<tunnel-id>.json  # Created by setup script
```

**Step 2: Verify file**

Read `.env.example` to confirm append is correct.

---

### Task 2: Create `.cloudflared/config.yml` template

**Objective:** Create the cloudflared ingress configuration that routes API and web traffic from the tunnel subdomain to the host services.

**Files:**
- Create: `~/dev/bunnystack/.cloudflared/config.yml`

**Step 1: Write cloudflared config**

```yaml
# cloudflared ingress configuration
# Routes <subdomain>.jsnchn.net traffic to local dev services
# The tunnel name and credentials-file are templated for the setup script
tunnel: ${TUNNEL_NAME}
credentials-file: /home/nonroot/.cloudflared/${TUNNEL_CREDENTIALS_FILE}

ingress:
  # API routes — proxy directly to Elysia on port 3000
  - hostname: "${TUNNEL_SUBDOMAIN}.jsnchn.net"
    path: "/api/*"
    service: http://host.docker.internal:3000
  - hostname: "${TUNNEL_SUBDOMAIN}.jsnchn.net"
    path: "/api*"
    service: http://host.docker.internal:3000
  # Health endpoint
  - hostname: "${TUNNEL_SUBDOMAIN}.jsnchn.net"
    path: "/health"
    service: http://host.docker.internal:3000
  # Everything else → Vite dev server on 5173
  - hostname: "${TUNNEL_SUBDOMAIN}.jsnchn.net"
    service: http://host.docker.internal:5173
  # Catch-all: return 404 for unknown hostnames
  - service: http_status:404
```

Note: This file uses shell variable syntax (`${VAR}`) that the setup script will substitute with envsubst or sed.

**Step 2: Verify file**

Check it exists at the right path.

---

### Task 3: Create `scripts/setup-tunnel.sh`

**Objective:** One-time tunnel setup script that authenticates, creates the tunnel, generates the config, and routes DNS.

**Files:**
- Create: `~/dev/bunnystack/scripts/setup-tunnel.sh`

**Step 1: Write setup script**

```bash
#!/usr/bin/env bash
set -euo pipefail

# Cloudflare Tunnel Setup Script for Bunnystack
# Run this once per project after cloning to set up the tunnel.
# Requires: .env file with TUNNEL_SUBDOMAIN, TUNNEL_NAME
#            cloudflared binary installed on host (brew install cloudflared / apt)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Load env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

TUNNEL_NAME="${TUNNEL_NAME:-bunnystack-tunnel}"
TUNNEL_SUBDOMAIN="${TUNNEL_SUBDOMAIN:-}"
CLOUDFLARE_DIR="$PROJECT_ROOT/.cloudflared"

if [ -z "$TUNNEL_SUBDOMAIN" ]; then
  echo "❌ TUNNEL_SUBDOMAIN not set in .env"
  echo "   Add: TUNNEL_SUBDOMAIN=your-project-name"
  exit 1
fi

TUNNEL_HOSTNAME="${TUNNEL_SUBDOMAIN}.jsnchn.net"

echo "🔑 Step 1: Authenticating with Cloudflare..."
cloudflared tunnel login || { echo "❌ Login failed"; exit 1; }

echo "🏗️  Step 2: Creating tunnel '$TUNNEL_NAME'..."
EXISTING=$(cloudflared tunnel list | grep "$TUNNEL_NAME" || true)
if [ -n "$EXISTING" ]; then
  echo "   Tunnel '$TUNNEL_NAME' already exists. Skipping."
else
  cloudflared tunnel create "$TUNNEL_NAME"
fi

# Find the credentials file
CRED_FILE=$(ls "$CLOUDFLARE_DIR"/*.json 2>/dev/null | head -1 || echo "")
if [ -z "$CRED_FILE" ]; then
  echo "❌ No credentials file found in $CLOUDFLARE_DIR"
  echo "   Try: ls ~/.cloudflared/*.json and copy it to $CLOUDFLARE_DIR/"
  exit 1
fi

TUNNEL_ID=$(basename "$CRED_FILE" .json)
CRED_FILENAME=$(basename "$CRED_FILE")

echo "📝 Step 3: Writing cloudflared config..."
mkdir -p "$CLOUDFLARE_DIR"

# Copy credentials file into .cloudflared/
cp "$CRED_FILE" "$CLOUDFLARE_DIR/$CRED_FILENAME" 2>/dev/null || true

# Generate config with tunnel ID
cat > "$CLOUDFLARE_DIR/config.yml" << CLOUDCONF
tunnel: ${TUNNEL_NAME}
credentials-file: /home/nonroot/.cloudflared/${CRED_FILENAME}

ingress:
  - hostname: "${TUNNEL_HOSTNAME}"
    path: "/api/*"
    service: http://host.docker.internal:3000
  - hostname: "${TUNNEL_HOSTNAME}"
    path: "/api*"
    service: http://host.docker.internal:3000
  - hostname: "${TUNNEL_HOSTNAME}"
    path: "/health"
    service: http://host.docker.internal:3000
  - hostname: "${TUNNEL_HOSTNAME}"
    service: http://host.docker.internal:5173
  - service: http_status:404
CLOUDCONF

echo "🌐 Step 4: Routing DNS..."
cloudflared tunnel route dns "$TUNNEL_NAME" "$TUNNEL_HOSTNAME"

echo ""
echo "✅ Tunnel setup complete!"
echo "   Tunnel:   $TUNNEL_NAME ($TUNNEL_ID)"
echo "   Hostname: https://$TUNNEL_HOSTNAME"
echo ""
echo "   To start with tunnel, run:  bun run dev:with-tunnel"
echo "   To test:                    curl https://$TUNNEL_HOSTNAME/health"
```

**Step 2: Make executable**

```bash
chmod +x scripts/setup-tunnel.sh
```

---

### Task 4: Create `docker-compose.tunnel.yml`

**Objective:** Docker Compose override file that adds the cloudflared service alongside the existing db service.

**Files:**
- Create: `~/dev/bunnystack/docker-compose.tunnel.yml`

**Step 1: Write the compose override**

```yaml
# Docker Compose override — adds Cloudflare Tunnel service
# Usage: docker compose -f docker-compose.yml -f docker-compose.tunnel.yml up -d
# Or use the `bun run dev:with-tunnel` script which handles this.
services:
  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: bunnystack-tunnel
    restart: unless-stopped
    # Use host network so cloudflared can reach localhost:3000 and localhost:5173
    # running on the host (Bun/Vite dev servers, not in Docker)
    network_mode: "host"
    volumes:
      - .cloudflared:/home/nonroot/.cloudflared:ro
    command: tunnel run
```

Note: Using `network_mode: "host"` gives the container direct access to host ports. On macOS, Docker Desktop handles this. On Linux, Docker 20.10+ supports it natively. No `host.docker.internal` dependency.

**Step 2: Verify file**

Check it exists and is valid YAML.

---

### Task 5: Add `dev:with-tunnel` script to root `package.json`

**Objective:** Add a new script that runs `turbo run dev` and `docker compose up cloudflared` together.

**Files:**
- Modify: `~/dev/bunnystack/package.json`

**Step 1: Add dev-with-tunnel script**

Add `"dev:with-tunnel"` and `"tunnel:up"` scripts to the root `package.json`:

```json
"dev:with-tunnel": "bun run tunnel:up & sleep 3 && bun run dev",
"tunnel:up": "docker compose -f docker-compose.yml -f docker-compose.tunnel.yml up -d cloudflared",
"tunnel:down": "docker compose -f docker-compose.yml -f docker-compose.tunnel.yml down",
"tunnel:logs": "docker compose -f docker-compose.yml -f docker-compose.tunnel.yml logs -f cloudflared",
"tunnel:setup": "bash scripts/setup-tunnel.sh"
```

Insert after the existing `db:studio` line (or at the end of the scripts block, before the closing `}`).

**Step 2: Verify**

Run `cat package.json | grep tunnel` to confirm scripts are present.

---

### Task 6: Update turbo.json for concurrent tunnel-aware dev

**Objective:** Add a `dev:with-tunnel` task to turbo.json so `turbo run dev:with-tunnel` works if needed.

**Files:**
- Modify: `~/dev/bunnystack/turbo.json`

**Step 1: Add dev:with-tunnel task**

After the existing `dev` task in turbo.json, add:

```json
"dev:with-tunnel": {
  "cache": false,
  "persistent": true,
  "dependsOn": ["^build"]
}
```

---

### Task 7: Update `.gitignore`

**Objective:** Ignore tunnel credentials and generated files.

**Files:**
- Modify: `~/dev/bunnystack/.gitignore`

**Step 1: Add tunnel entries**

Append to `.gitignore`:

```gitignore
# Cloudflare Tunnel
.cloudflared/*.json
.cloudflared/cert.pem
```

The `config.yml` in `.cloudflared` should NOT be ignored — it's the template that gets filled in by the setup script. But the credentials JSON and cert should be ignored (they're secrets).

Actually, on second thought, let me keep it simple — ignore all `.cloudflared/` except keep `config.yml`:

```gitignore
# Cloudflare Tunnel
.cloudflared/*.json
.cloudflared/cert.pem
```

---

### Task 8: Update `agents.md`

**Objective:** Document the tunnel feature in the AI agent orientation guide.

**Files:**
- Modify: `~/dev/bunnystack/agents.md`

**Step 1: Add tunnel section**

Add a new section after the "Common Commands" block:

```markdown
| `bun run dev:with-tunnel` | Start dev servers + Cloudflare Tunnel |
| `bun run tunnel:up` | Start the tunnel (Docker) |
| `bun run tunnel:down` | Stop the tunnel |
| `bun run tunnel:logs` | View tunnel logs |
| `bun run tunnel:setup` | One-time tunnel setup (auth + DNS) |
```

And below, a new section before "CodeGraph":

```markdown
---

## Cloudflare Tunnel

The project includes an optional Cloudflare Tunnel for receiving webhooks and
exposing the local dev environment over a public subdomain.

**One-time setup per project:**

```bash
bun run tunnel:setup
```

This runs the `scripts/setup-tunnel.sh` script which:
1. Authenticates with Cloudflare (`cloudflared tunnel login`)
2. Creates a named tunnel
3. Routes DNS — `<subdomain>.jsnchn.net` points to the tunnel
4. Generates `.cloudflared/config.yml` for Docker

**Start with tunnel:**

```bash
bun run dev:with-tunnel
```

This starts the tunnel (Docker) and then launches `bun run dev`. Your
dev environment is now accessible at `https://<subdomain>.jsnchn.net`.

**Architecture:**

```
cloudflared (Docker) ──┬── /api/* ──→ localhost:3000 (Elysia API)
                       └── /* ─────→ localhost:5173 (Vite dev server)
```

**Environment variables** (in `.env`):

| Variable | Example | Description |
|---|---|---|
| `TUNNEL_SUBDOMAIN` | `mycoolapp` | Subdomain: `<name>.jsnchn.net` |
| `TUNNEL_NAME` | `bunnystack-tunnel` | cloudflared tunnel name |
```

---

### Task 9: Update `README.md`

**Objective:** Document the tunnel feature for developers using the template.

**Files:**
- Modify: `~/dev/bunnystack/README.md`

**Step 1: Add tunnel section in "Available Scripts" table**

Insert a row in the root-level scripts section:

```
| `bun run dev:with-tunnel` | Start dev servers with Cloudflare Tunnel (Docker, optional) |
| `bun run tunnel:setup`    | One-time: authenticate Cloudflare, create tunnel, route DNS |
| `bun run tunnel:up`       | Start the tunnel container |
| `bun run tunnel:down`     | Stop the tunnel container |
| `bun run tunnel:logs`     | View tunnel logs |
```

**Step 2: Add tunnel section to .env.example docs**

Add to the env vars table:

```
| `TUNNEL_SUBDOMAIN` | `myproject` | Subdomain prefix: `<name>.jsnchn.net` |
| `TUNNEL_NAME` | `bunnystack-tunnel` | cloudflared tunnel name (for DNS routing) |
```

**Step 3: Add "Cloudflare Tunnel" section**

Near the end (before "AI Tooling" or wherever makes sense), add:

```markdown
---

## Cloudflare Tunnel (Optional)

The project includes an optional Cloudflare Tunnel for receiving webhooks and
sharing your local dev environment over a public URL during development.

### One-time setup

```bash
# 1. Install cloudflared (if not already installed)
brew install cloudflared     # macOS
sudo apt install cloudflared  # Debian/Ubuntu

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

This means the Vite dev server proxy (which handles `/api` in dev mode) is bypassed —
the API handles its own routes directly through the tunnel, reducing hops.
```

---

### Task 10: Update Vite config to handle tunnel-origin API calls

**Objective:** Ensure cookies/auth work correctly when the web app is accessed via the tunnel domain (not just localhost).

**Files:**
- Modify: `~/dev/bunnystack/apps/web/vite.config.ts` (if needed)

**Step 1: Assess if changes are needed**

The Vite proxy is configured to proxy `/api` to `http://localhost:3000`. When the web app is accessed via `https://myproject.jsnchn.net`, the browser makes API calls to the same origin (the tunnel domain), which cloudflared routes directly to the API on port 3000. So the Vite proxy is bypassed.

However, the API client in `apps/web/src/lib/api.ts` uses relative paths (`/api/...`), which means API calls go to the same origin as the page. This is correct behavior.

The key concern is **cookies and CORS**. When Better-Auth sets cookies, it needs to use the correct domain. The `BETTER_AUTH_URL` env var should be set to `https://myproject.jsnchn.net` when using the tunnel. This is a .env concern, not a code change.

For the API's CORS config (`@elysiajs/cors`), we may need to allow the tunnel origin. Let me check the current cors setup.

Actually, since the tunnel routes both web and API under the same hostname, Same-Origin requests don't need CORS. But if Better-Auth does redirects, it needs to know the public URL.

This task might not need code changes — it's a documentation/configuration concern. Let me note it in the plan but skip actual file changes unless needed.

**Decision:** No code changes needed for Vite config. The existing setup works because:
1. API calls use relative paths (`/api/...`) — same origin
2. The tunnel routes both web and API under the same hostname
3. CORS is not needed for same-origin requests
4. Users should set `BETTER_AUTH_URL` to the tunnel URL in their `.env`

Add a note to the README about this.

---

### Task 11: Verify the full setup

**Objective:** Confirm all files are in place and the configuration is valid.

**Step 1: Check file tree**

```bash
find ~/dev/bunnystack/.cloudflared -type f 2>/dev/null
ls -la ~/dev/bunnystack/scripts/setup-tunnel.sh
```

**Step 2: Validate compose file**

```bash
cd ~/dev/bunnystack && docker compose -f docker-compose.yml -f docker-compose.tunnel.yml config 2>&1 | head -20
```

**Step 3: Check package.json scripts**

```bash
cd ~/dev/bunnystack && cat package.json | grep -A1 tunnel
```

**Step 4: Verify .gitignore**

```bash
cd ~/dev/bunnystack && cat .gitignore | tail -5
```

**Step 5: Run type-check**

```bash
cd ~/dev/bunnystack && bun run check-types 2>&1 | tail -5
```

---

## Summary of Changes

| File | Action |
|---|---|
| `.env.example` | Add `TUNNEL_SUBDOMAIN`, `TUNNEL_NAME`, `CLOUDFLARE_ACCOUNT_TAG` |
| `.cloudflared/config.yml` | **Create** — ingress rules for tunnel |
| `scripts/setup-tunnel.sh` | **Create** — one-time tunnel setup |
| `docker-compose.tunnel.yml` | **Create** — cloudflared Docker service |
| `package.json` | Add `dev:with-tunnel`, `tunnel:up`, `tunnel:down`, `tunnel:logs`, `tunnel:setup` scripts |
| `turbo.json` | Add `dev:with-tunnel` task |
| `.gitignore` | Add `.cloudflared/*.json`, `.cloudflared/cert.pem` |
| `agents.md` | Document tunnel commands and architecture |
| `README.md` | Document tunnel section |

## Verification

1. `docker compose -f docker-compose.yml -f docker-compose.tunnel.yml config` — should parse without errors
2. `bun run check-types` — should pass (no TS changes, so this is a sanity check)
3. File tree should show new `.cloudflared/`, `scripts/`, and `docker-compose.tunnel.yml`