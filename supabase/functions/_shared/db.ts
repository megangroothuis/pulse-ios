import postgres from 'postgres';

export type Sql = postgres.Sql;

let sql: Sql | undefined;

/**
 * Direct Postgres connection. Edge Functions get SUPABASE_DB_URL automatically;
 * it connects as a privileged role, so it can reach the `private` schema that
 * the Data API (and therefore every client key) cannot.
 */
export function getSql(): Sql {
  sql ??= postgres(Deno.env.get('SUPABASE_DB_URL')!, { prepare: false, max: 3 });
  return sql;
}
