-- Push registration is opt-in and scoped to the signed-in account.
create table if not exists public.push_subscriptions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 endpoint text not null unique,
 p256dh text not null,
 auth text not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user on public.push_subscriptions(user_id);
alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from public,anon,authenticated;
grant select,insert,update,delete on public.push_subscriptions to authenticated;
create policy "owner read push subscriptions" on public.push_subscriptions for select to authenticated using(user_id=(select auth.uid()));
create policy "owner create push subscription" on public.push_subscriptions for insert to authenticated with check(user_id=(select auth.uid()));
create policy "owner update push subscription" on public.push_subscriptions for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy "owner delete push subscription" on public.push_subscriptions for delete to authenticated using(user_id=(select auth.uid()));
-- Delivery claims prevent repeated HTTP calls from spamming the same event.
create table if not exists public.push_delivery_claims (
 event_key text primary key,
 actor_id uuid not null references auth.users(id) on delete cascade,
 recipient_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
alter table public.push_delivery_claims enable row level security;
revoke all on public.push_delivery_claims from public,anon,authenticated;
notify pgrst,'reload schema';
