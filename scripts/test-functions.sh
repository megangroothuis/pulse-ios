#!/usr/bin/env bash
# Tests for the Supabase side: transformation, OAuth state, RLS and full sync.
#
# DB-backed tests need a Postgres server you can create databases on:
#   ADMIN_DATABASE_URL=postgres://postgres@localhost:5432/postgres bash scripts/test-functions.sh
# Without it only the pure unit tests run. The database `pulse_test` is
# dropped and recreated with a stub of Supabase's auth schema + our migrations.
set -euo pipefail
cd "$(dirname "$0")/.."

DENO="${DENO:-npx -y deno}"

if [ -n "${ADMIN_DATABASE_URL:-}" ]; then
  psql "$ADMIN_DATABASE_URL" -qc "drop database if exists pulse_test" -c "create database pulse_test"
  TEST_DATABASE_URL="$(node -e 'const u = new URL(process.argv[1]); u.pathname = "/pulse_test"; console.log(u.href)' "$ADMIN_DATABASE_URL")"
  # Cron migration needs pg_cron/pg_net/vault, which only exist on Supabase.
  psql "$TEST_DATABASE_URL" -q -v ON_ERROR_STOP=1 \
    -f supabase/tests/supabase_stub.sql \
    $(ls supabase/migrations/*.sql | grep -v _sync_cron | sed 's/^/-f /')
  export TEST_DATABASE_URL
else
  echo "ADMIN_DATABASE_URL not set: skipping database tests"
fi

cd supabase/functions
$DENO check */index.ts
$DENO test --allow-env --allow-net --allow-read --allow-write --allow-sys _shared/
