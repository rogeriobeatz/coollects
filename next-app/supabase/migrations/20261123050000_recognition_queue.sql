-- Durable individual recognition queue. Images remain Base64 so the worker uses
-- the same transport that proved faster for Coollects.
create table if not exists public.recognition_jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  image_sha256 text not null check (image_sha256 ~ '^[a-f0-9]{64}$'),
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp')),
  image_base64 text not null,
  status text not null default 'queued'
    check (status in ('queued','processing','retry_wait','waiting_user','final_retry_wait','completed','failed')),
  attempts integer not null default 0 check (attempts >= 0),
  next_attempt_at timestamptz not null default now(),
  last_attempt_at timestamptz,
  raw_response text,
  suggestion jsonb,
  last_error text,
  trace text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id,image_sha256)
);
alter table public.recognition_jobs enable row level security;
grant select on public.recognition_jobs to authenticated;
create policy "owners read own recognition jobs" on public.recognition_jobs
  for select to authenticated using (owner_id = (select auth.uid()));
create index if not exists recognition_jobs_due_idx
  on public.recognition_jobs(status,next_attempt_at) where status in ('queued','retry_wait','final_retry_wait');

create or replace function public.claim_recognition_job()
returns setof public.recognition_jobs
language sql
security definer
set search_path = public
as $$
  update public.recognition_jobs j
  set status='processing', attempts=j.attempts+1,
      last_attempt_at=now(), updated_at=now()
  where j.id = (
    select id from public.recognition_jobs
    where status in ('queued','retry_wait','final_retry_wait')
      and next_attempt_at <= now()
    order by next_attempt_at,created_at
    for update skip locked limit 1
  )
  returning j.*;
$$;
revoke all on function public.claim_recognition_job() from public,anon,authenticated;
grant execute on function public.claim_recognition_job() to service_role;

-- Invoke the recognition worker alongside the existing bulk-import worker.
select cron.schedule(
 'coollects-recognition-worker',
 '* * * * *',
 $job$
 select net.http_get(
  url := (select decrypted_secret from vault.decrypted_secrets where name='recognition_worker_url'),
  headers := jsonb_build_object(
   'Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='recognition_worker_secret'),
   'Accept','application/json'
  ),
  timeout_milliseconds := 5000
 );
 $job$
);
