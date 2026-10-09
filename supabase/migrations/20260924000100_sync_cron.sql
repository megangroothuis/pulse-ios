-- Background sync every 20 minutes.
--
-- Spotify only exposes the last 50 plays, so history has to be captured
-- regularly or the early songs of a long workout are lost.
--
-- Before this runs, store two Vault secrets (SQL editor, once per project):
--   select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
--   select vault.create_secret('<same value as the CRON_SECRET function secret>', 'cron_secret');

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'pulse-sync-all',
  '*/20 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{"all": true}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);
