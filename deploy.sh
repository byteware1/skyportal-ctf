#!/usr/bin/env bash
# ============================================================
# SkyPortal VPS Deployment Script
# Run: chmod +x deploy.sh && sudo ./deploy.sh
# ============================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${CYAN}[skyportal]${NC} $1"; }
ok()   { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

echo ""
echo -e "${CYAN}╔══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   SkyPortal Deployment Script v1.0   ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════╝${NC}"
echo ""

# Check root
[[ $EUID -ne 0 ]] && err "This script must be run as root"

# Check .env exists
[[ ! -f .env ]] && err ".env file not found. Copy .env.example to .env and configure it."

# Load env
source .env

# Validate required vars
[[ -z "${DB_PASSWORD:-}" ]] && err "DB_PASSWORD not set in .env"
[[ -z "${JWT_SECRET:-}" ]] && err "JWT_SECRET not set in .env"
[[ -z "${LAB_HOST:-}" ]] && err "LAB_HOST not set in .env"

# Check Docker
log "Checking Docker..."
command -v docker &>/dev/null || err "Docker not installed. Install from https://docs.docker.com/engine/install/"
command -v docker compose &>/dev/null || err "Docker Compose v2 not installed."
ok "Docker $(docker --version | cut -d' ' -f3 | tr -d ',')"

# Configure firewall (UFW)
if command -v ufw &>/dev/null; then
  log "Configuring UFW firewall..."
  ufw allow 80/tcp    &>/dev/null
  ufw allow 443/tcp   &>/dev/null
  ufw allow 4000/tcp  &>/dev/null
  ufw allow 10000:11000/tcp &>/dev/null
  ok "Firewall rules applied"
else
  warn "UFW not found. Ensure ports 80, 443, 10000-11000 are open in your firewall."
fi

# Build lab images
log "Building lab Docker images..."
docker build -t skyportal/lab-sqli-01 ./labs/sqli-lab-01 --quiet
ok "Built skyportal/lab-sqli-01"

docker build -t skyportal/lab-xss-01 ./labs/xss-lab-01 --quiet
ok "Built skyportal/lab-xss-01"

# Build and start platform
log "Building platform images..."
docker compose build --quiet

log "Starting SkyPortal..."
docker compose up -d

# Wait for health
log "Waiting for services to be ready..."
RETRIES=30
until curl -sf http://localhost:4000/api/health &>/dev/null; do
  sleep 2
  RETRIES=$((RETRIES-1))
  [[ $RETRIES -le 0 ]] && err "Backend did not start in time. Check: docker compose logs backend"
done

ok "Backend is healthy"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           🚀 DEPLOYMENT COMPLETE           ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Platform URL:  ${CYAN}http://${LAB_HOST}${NC}"
echo -e "  Admin Panel:   ${CYAN}http://${LAB_HOST}/admin${NC}"
echo -e "  API Health:    ${CYAN}http://${LAB_HOST}/api/health${NC}"
echo ""
echo -e "  Default admin: ${YELLOW}admin / Admin@SkyPortal2024${NC}"
echo -e "  ${RED}⚠  Change the admin password immediately!${NC}"
echo ""
echo -e "  Logs:  ${CYAN}docker compose logs -f${NC}"
echo -e "  Stop:  ${CYAN}docker compose down${NC}"
echo ""
