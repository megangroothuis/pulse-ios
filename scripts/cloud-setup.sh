#!/usr/bin/env bash
# Setup script for Claude Code cloud environments (also fine to run locally on
# Linux/macOS). Non-interactive and idempotent — safe to re-run.
#
# Paste the contents into: environment settings -> Setup script, or call it
# from there with:  bash "$REPO_DIR/scripts/cloud-setup.sh"
#
# What it does:
#   1. Ensures Node >= 20.19.4 (React Native 0.81 / Expo SDK 54 requirement)
#   2. npm ci (only when package-lock.json changed since the last install)
#   3. Ensures a global Playwright for the headless smoke test (browsers are
#      pre-installed in the cloud image; never downloads them)
#
# There is no database, backend or seed step: every screen App.tsx routes to
# reads bundled mock data from src/data/mockData.ts.
set -euo pipefail

log() { printf '\n[pulse-setup] %s\n' "$*"; }

# --- locate the repo ---------------------------------------------------------
REPO_DIR="${CLAUDE_PROJECT_DIR:-}"
if [[ -z "$REPO_DIR" ]]; then
  if [[ -f package.json ]] && grep -q '"name": "pulse"' package.json; then
    REPO_DIR="$PWD"
  elif [[ -f "$(dirname "${BASH_SOURCE[0]}")/../package.json" ]]; then
    REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
  else
    REPO_DIR="/home/user/pulse-ios"
  fi
fi
cd "$REPO_DIR"
log "repo: $REPO_DIR"

# --- 1. Node -----------------------------------------------------------------
REQUIRED_NODE="20.19.4"
node_ok() {
  command -v node >/dev/null 2>&1 || return 1
  local v; v="$(node -p 'process.versions.node')"
  [[ "$(printf '%s\n%s\n' "$REQUIRED_NODE" "$v" | sort -V | head -1)" == "$REQUIRED_NODE" ]]
}
if ! node_ok; then
  log "Node >= $REQUIRED_NODE not found; installing Node 22 via nvm"
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  if [[ ! -s "$NVM_DIR/nvm.sh" ]]; then
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | PROFILE=/dev/null bash
  fi
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh"
  nvm install 22 >/dev/null
  nvm alias default 22 >/dev/null
fi
log "node $(node -v), npm $(npm -v)"

# --- 2. JS dependencies ------------------------------------------------------
# .npmrc sets legacy-peer-deps=true; npm ci honours it.
LOCK_HASH="$(sha256sum package-lock.json | cut -d' ' -f1)"
STAMP="node_modules/.pulse-lock-hash"
if [[ -d node_modules && -f "$STAMP" && "$(cat "$STAMP")" == "$LOCK_HASH" ]]; then
  log "node_modules up to date (lockfile unchanged)"
else
  log "installing dependencies (npm ci)"
  npm ci --no-audit --no-fund
  echo "$LOCK_HASH" > "$STAMP"
fi

# --- 3. Playwright for the smoke test ---------------------------------------
# The cloud image ships Chromium in /opt/pw-browsers (for Playwright 1.56.x).
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
if NODE_PATH="$(npm root -g)" node -e "require('playwright')" >/dev/null 2>&1; then
  log "playwright already available globally"
else
  log "installing playwright (global, no browser download)"
  npm install -g --no-audit --no-fund playwright@1.56.1
fi

# --- sanity check ------------------------------------------------------------
log "sanity check: resolving Expo config"
EXPO_OFFLINE=1 EXPO_NO_TELEMETRY=1 npx expo config --type public >/dev/null
log "done. Next: npm run verify   (see CLAUDE.md)"
