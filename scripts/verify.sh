#!/usr/bin/env bash
# One-shot verification: typecheck (against a known baseline), backend tests,
# build the web and iOS JS bundles, then run the headless web smoke tests in
# demo mode (mock data) and live mode (against scripts/mock-supabase.cjs).
#
#   npm run verify                  # full run
#   SKIP_BUNDLES=1 npm run verify   # skip the (slower) export step
#   ADMIN_DATABASE_URL=postgres://... npm run verify   # also run DB-backed backend tests
#
# Reuses a dev server already listening on :8081; otherwise starts one and
# stops it afterwards. Live mode always uses its own server on :8082.
set -uo pipefail
cd "$(dirname "$0")/.."

export EXPO_OFFLINE=1 EXPO_NO_TELEMETRY=1

# Number of pre-existing TypeScript errors in code reachable from App.tsx.
# If you fix some, lower this number. Never raise it to make a change pass.
TYPECHECK_BASELINE=13
PORT=8081
fail=0

echo "== typecheck (baseline: $TYPECHECK_BASELINE errors) =="
tc_out="$(npx tsc -p tsconfig.app.json 2>&1)"
tc_count="$(grep -c 'error TS' <<<"$tc_out" || true)"
if (( tc_count > TYPECHECK_BASELINE )); then
  echo "$tc_out"
  echo "FAIL: $tc_count type errors (baseline $TYPECHECK_BASELINE) — you added new ones"
  fail=1
elif (( tc_count < TYPECHECK_BASELINE )); then
  echo "OK: $tc_count type errors — below baseline, lower TYPECHECK_BASELINE in scripts/verify.sh"
else
  echo "OK: $tc_count type errors (unchanged)"
fi

echo "== backend tests (Deno) =="
if bash scripts/test-functions.sh >/tmp/pulse-functions.log 2>&1; then
  grep -E "passed|skipping" /tmp/pulse-functions.log | sed 's/\x1b\[[0-9;]*m//g'
else
  tail -60 /tmp/pulse-functions.log; echo "FAIL: backend tests"; fail=1
fi

if [[ -z "${SKIP_BUNDLES:-}" ]]; then
  echo "== bundle: web =="
  if npx expo export --platform web --output-dir dist/web >/tmp/pulse-export-web.log 2>&1; then
    echo "OK"
  else
    tail -40 /tmp/pulse-export-web.log; echo "FAIL: web bundle"; fail=1
  fi
  echo "== bundle: ios =="
  if npx expo export --platform ios --output-dir dist/ios >/tmp/pulse-export-ios.log 2>&1; then
    echo "OK"
  else
    tail -40 /tmp/pulse-export-ios.log; echo "FAIL: ios bundle"; fail=1
  fi
fi

echo "== smoke (web, headless Chromium) =="
started_pid=""
if ! curl -sf "http://localhost:$PORT" >/dev/null; then
  echo "starting dev server on :$PORT (log: /tmp/pulse-expo.log)"
  CI=1 setsid npx expo start --web --port "$PORT" >/tmp/pulse-expo.log 2>&1 &
  started_pid=$!
  for _ in $(seq 1 90); do
    curl -sf "http://localhost:$PORT" >/dev/null && break
    sleep 2
  done
fi
if NODE_PATH="$(npm root -g)" node scripts/smoke-web.cjs "http://localhost:$PORT"; then
  :
else
  fail=1
fi
if [[ -n "$started_pid" ]]; then
  kill -- -"$started_pid" 2>/dev/null || kill "$started_pid" 2>/dev/null || true
fi

echo "== smoke (live mode vs mock Supabase, headless Chromium) =="
LIVE_PORT=8082
MOCK_PORT=54321
node scripts/mock-supabase.cjs "$MOCK_PORT" >/tmp/pulse-mock-supabase.log 2>&1 &
mock_pid=$!
EXPO_PUBLIC_SUPABASE_URL="http://localhost:$MOCK_PORT" EXPO_PUBLIC_SUPABASE_ANON_KEY=mock-anon-key \
  CI=1 setsid npx expo start --web --port "$LIVE_PORT" >/tmp/pulse-expo-live.log 2>&1 &
live_pid=$!
for _ in $(seq 1 90); do
  curl -sf "http://localhost:$LIVE_PORT" >/dev/null && break
  sleep 2
done
if ! NODE_PATH="$(npm root -g)" node scripts/smoke-live.cjs "http://localhost:$LIVE_PORT"; then
  fail=1
fi
kill -- -"$live_pid" 2>/dev/null || kill "$live_pid" 2>/dev/null || true
kill "$mock_pid" 2>/dev/null || true

echo
if (( fail )); then echo "VERIFY FAILED"; exit 1; fi
echo "VERIFY PASSED"
