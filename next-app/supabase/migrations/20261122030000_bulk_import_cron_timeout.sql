-- The worker can analyze two photos sequentially (up to 25s each).
-- Keep pg_net's request timeout aligned with the Vercel function duration.
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
  timeout_milliseconds := 60000
 );
 $job$
);
