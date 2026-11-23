-- Durable recognition recovery: preserve provider output before parsing it.
create table if not exists public.recognition_cache (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  image_sha256 text not null check (image_sha256 ~ '^[a-f0-9]{64}$'),
  status text not null default 'processing'
    check (status in ('processing','response_received','completed','parse_error','provider_error')),
  raw_response text,
  suggestion jsonb,
  error_stage text,
  error_message text,
  model text not null default 'gemini-3-8-flash',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, image_sha256)
);

alter table public.recognition_cache enable row level security;
grant select, insert, update on public.recognition_cache to authenticated;
create policy "owners manage own recognition cache"
  on public.recognition_cache
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create index if not exists recognition_cache_updated_idx
  on public.recognition_cache(updated_at desc);
