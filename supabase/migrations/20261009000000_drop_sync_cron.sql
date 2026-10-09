-- Replace the 20-minute background sync with Strava webhooks (strava-webhook
-- function): a sync now runs when a workout is posted, or on pull-to-refresh.
do $$
begin
  if exists (select from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'pulse-sync-all';
  end if;
end $$;
