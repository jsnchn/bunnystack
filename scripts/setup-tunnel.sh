#!/usr/bin/env bash
set -euo pipefail

# Cloudflare Tunnel Setup Script for Bunnystack
# Run this once per project after cloning to set up the tunnel.
# Requires:
#   - .env file with TUNNEL_SUBDOMAIN, TUNNEL_NAME
#   - cloudflared binary installed on host
#     macOS:  brew install cloudflared
#     Linux:  sudo apt install cloudflared  (or download from Cloudflare)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Load env variables
if [ -f .env ]; then
  set -a
  source .env
  set +a
else
  echo "❌ No .env file found. Copy .env.example to .env and set TUNNEL_SUBDOMAIN."
  exit 1
fi

TUNNEL_NAME="${TUNNEL_NAME:-bunnystack-tunnel}"
TUNNEL_SUBDOMAIN="${TUNNEL_SUBDOMAIN:-}"
CLOUDFLARE_DIR="$PROJECT_ROOT/.cloudflared"

if [ -z "$TUNNEL_SUBDOMAIN" ]; then
  echo "❌ TUNNEL_SUBDOMAIN is not set in .env"
  echo "   Add: TUNNEL_SUBDOMAIN=your-project-name"
  exit 1
fi

TUNNEL_HOSTNAME="${TUNNEL_SUBDOMAIN}.jsnchn.net"

echo "🔑 Step 1: Authenticating with Cloudflare..."
cloudflared tunnel login || {
  echo "❌ Login failed. Visit the URL above to authenticate with Cloudflare."
  exit 1
}

echo ""
echo "🏗️  Step 2: Creating tunnel '$TUNNEL_NAME'..."
EXISTING=$(cloudflared tunnel list 2>/dev/null | grep -E "^\s*[a-f0-9-]+\s+${TUNNEL_NAME}\s" || true)
if [ -n "$EXISTING" ]; then
  echo "   Tunnel '$TUNNEL_NAME' already exists. Skipping creation."
else
  cloudflared tunnel create "$TUNNEL_NAME"
fi

# Find the credentials file — cloudflared stores it in ~/.cloudflared/
HOST_CRED_DIR="$HOME/.cloudflared"
mkdir -p "$CLOUDFLARE_DIR"

CRED_FILE=""
if [ -d "$HOST_CRED_DIR" ]; then
  CRED_FILE=$(ls "$HOST_CRED_DIR"/*.json 2>/dev/null | head -1 || echo "")
fi

if [ -z "$CRED_FILE" ]; then
  # Also check .cloudflared/ directory itself (if rerunning after partial setup)
  CRED_FILE=$(ls "$CLOUDFLARE_DIR"/*.json 2>/dev/null | head -1 || echo "")
fi

if [ -z "$CRED_FILE" ]; then
  echo "❌ No credentials JSON file found."
  echo "   Checked: $HOST_CRED_DIR/ and $CLOUDFLARE_DIR/"
  echo "   Try: ls ~/.cloudflared/*.json"
  echo "   Then copy it to: $CLOUDFLARE_DIR/"
  exit 1
fi

TUNNEL_ID=$(basename "$CRED_FILE" .json)
CRED_FILENAME=$(basename "$CRED_FILE")

# Copy credentials into project's .cloudflared/ for Docker to mount
cp "$CRED_FILE" "$CLOUDFLARE_DIR/$CRED_FILENAME" 2>/dev/null || true

echo ""
echo "📝 Step 3: Writing cloudflared config..."
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

echo "🌐 Step 4: Routing DNS for $TUNNEL_HOSTNAME..."
cloudflared tunnel route dns "$TUNNEL_NAME" "$TUNNEL_HOSTNAME" || {
  echo "⚠️  DNS routing failed. You may need to route it manually:"
  echo "   cloudflared tunnel route dns $TUNNEL_NAME $TUNNEL_HOSTNAME"
  echo "   Then add a CNAME record in Cloudflare dashboard pointing to the tunnel."
}

echo ""
echo "============================================"
echo "✅ Tunnel setup complete!"
echo "============================================"
echo "   Tunnel:   $TUNNEL_NAME ($TUNNEL_ID)"
echo "   Hostname: https://$TUNNEL_HOSTNAME"
echo ""
echo "   To start dev servers with tunnel:"
echo "     bun run dev:with-tunnel"
echo ""
echo "   To test the tunnel is working:"
echo "     curl https://$TUNNEL_HOSTNAME/health"
echo ""
echo "   To stop the tunnel:"
echo "     bun run tunnel:down"
echo ""
echo "   Note: Set BETTER_AUTH_URL=https://$TUNNEL_HOSTNAME in .env"
echo "         for Better-Auth to generate correct redirects."
echo "============================================"