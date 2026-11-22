-- Supabase Cron runs the durable worker independently of a user's browser.
-- Credentials live in Vault; never put worker tokens in migration source.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
 'coollects-bulk-import-worker',
 '* * * * *',
 $job$
 select net.http_get(
  url := (select decrypted_secret from vault.decrypted_secrets where name='bulk_import_worker_url'),
  headers := jsonb_build_object(
   'Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='bulk_import_worker_secret'),
   'Accept','application/json'
  ),
  timeout_milliseconds := 5000
 );
 $job$
);
