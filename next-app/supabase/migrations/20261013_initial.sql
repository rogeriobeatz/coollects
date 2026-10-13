-- Coollects: schema MVP, Supabase PostgreSQL.
-- Apply through Supabase SQL Editor in a NEW project, review before executing.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 username text not null unique check (username ~ '^[a-z0-9_]{3,30}$'),
 display_name text not null check (char_length(display_name) between 2 and 60),
 bio text not null default '' check (char_length(bio)<=300),
 created_at timestamptz not null default now()
);
create table if not exists public.collections (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references public.profiles(id) on delete cascade,
 name text not null check (char_length(name) between 1 and 70),
 category text not null check (char_length(category) between 1 and 50),
 color text not null default '#6125BF' check (color ~ '^#[0-9A-Fa-f]{6}$'),
 description text not null default '' check (char_length(description)<=300),
 is_public boolean not null default false,
 created_at timestamptz not null default now()
);
create index if not exists collections_owner_date on public.collections(owner_id,created_at desc);
create index if not exists collections_public_date on public.collections(created_at desc) where is_public;

create table if not exists public.items (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references public.profiles(id) on delete cascade,
 name text not null check (char_length(name) between 1 and 90),
 brand text not null default '' check (char_length(brand)<=70),
 category text not null check (char_length(category) between 1 and 50),
 notes text not null default '' check (char_length(notes)<=300),
 photo_path text,
 created_at timestamptz not null default now()
);
create index if not exists items_owner_date on public.items(owner_id,created_at desc);
create table if not exists public.collection_items (
 collection_id uuid not null references public.collections(id) on delete cascade,
 item_id uuid not null references public.items(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(collection_id,item_id)
);
create index if not exists collection_items_by_item on public.collection_items(item_id);

create table if not exists public.scan_quotas (
 user_id uuid not null references auth.users(id) on delete cascade,
 scan_day date not null default (now() at time zone 'utc')::date,
 used integer not null default 0 check(used between 0 and 10),
 primary key(user_id,scan_day)
);

create or replace function public.on_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
 insert into public.profiles(id,username,display_name)
 values(new.id,'colecionador_'||substring(replace(new.id::text,'-',''),1,12),
        substring(coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'),''),'Colecionador'),1,60))
 on conflict(id) do nothing;
 return new;
end;$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.on_new_user();
insert into public.profiles(id,username,display_name)
select id,'colecionador_'||substring(replace(id::text,'-',''),1,12),'Colecionador' from auth.users
on conflict do nothing;

alter table public.profiles enable row level security;
alter table public.collections enable row level security;
alter table public.items enable row level security;
alter table public.collection_items enable row level security;
alter table public.scan_quotas enable row level security;

drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select to anon,authenticated using(true);
drop policy if exists "profiles own update" on public.profiles;
create policy "profiles own update" on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
-- Profiles are created by auth trigger, not arbitrary client inserts.

drop policy if exists "collections read" on public.collections;
create policy "collections read" on public.collections for select to anon,authenticated using(is_public or owner_id=(select auth.uid()));
drop policy if exists "collections insert" on public.collections;
create policy "collections insert" on public.collections for insert to authenticated with check(owner_id=(select auth.uid()));
drop policy if exists "collections update" on public.collections;
create policy "collections update" on public.collections for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
drop policy if exists "collections delete" on public.collections;
create policy "collections delete" on public.collections for delete to authenticated using(owner_id=(select auth.uid()));

drop policy if exists "links read" on public.collection_items;
create policy "links read" on public.collection_items for select to anon,authenticated using(
 exists (select 1 from public.collections c where c.id=collection_id and (c.is_public or c.owner_id=(select auth.uid())))
);
drop policy if exists "items read" on public.items;
create policy "items read" on public.items for select to anon,authenticated using(
 owner_id=(select auth.uid()) or exists (
 select 1 from public.collection_items ci
 join public.collections c on c.id=ci.collection_id
 where ci.item_id=items.id and c.is_public
 )
);
drop policy if exists "items insert" on public.items;
create policy "items insert" on public.items for insert to authenticated with check(owner_id=(select auth.uid()));
drop policy if exists "items update" on public.items;
create policy "items update" on public.items for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
drop policy if exists "items delete" on public.items;
create policy "items delete" on public.items for delete to authenticated using(owner_id=(select auth.uid()));

drop policy if exists "links insert" on public.collection_items;
create policy "links insert" on public.collection_items for insert to authenticated with check(
 exists(select 1 from public.collections c where c.id=collection_id and c.owner_id=(select auth.uid())) and
 exists(select 1 from public.items i where i.id=item_id and i.owner_id=(select auth.uid()))
);
drop policy if exists "links delete" on public.collection_items;
create policy "links delete" on public.collection_items for delete to authenticated using(
 exists(select 1 from public.collections c where c.id=collection_id and c.owner_id=(select auth.uid()))
);

-- 10 scans/day/user. A single atomic DB operation prevents concurrent bypass.
create or replace function public.consume_scan_quota()
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare accepted boolean;
begin
 if (select auth.uid()) is null then return false; end if;
 insert into public.scan_quotas(user_id,scan_day,used)
 values((select auth.uid()),(now() at time zone 'utc')::date,1)
 on conflict(user_id,scan_day) do update
 set used=scan_quotas.used+1
 where scan_quotas.used<10
 returning true into accepted;
 return coalesce(accepted,false);
end;$$;
revoke all on function public.consume_scan_quota() from public,anon;
grant execute on function public.consume_scan_quota() to authenticated;

-- Private image bucket: never expose a public URL to private objects.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('coollects-items','coollects-items',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=5242880,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "upload own item images" on storage.objects;
create policy "upload own item images" on storage.objects for insert to authenticated with check(
 bucket_id='coollects-items' and (storage.foldername(name))[1]=(select auth.uid())::text
);
drop policy if exists "read visible item images" on storage.objects;
create policy "read visible item images" on storage.objects for select to anon,authenticated using(
 bucket_id='coollects-items' and (
 (storage.foldername(name))[1]=(select auth.uid())::text
 or exists (
  select 1 from public.items i
  join public.collection_items ci on ci.item_id=i.id
  join public.collections c on c.id=ci.collection_id
  where i.photo_path=name and c.is_public
 )
 )
);
drop policy if exists "delete own item images" on storage.objects;
create policy "delete own item images" on storage.objects for delete to authenticated using(
 bucket_id='coollects-items' and (storage.foldername(name))[1]=(select auth.uid())::text
);
-- No public file listing / no UPDATE permission. Object names are UUIDs in owner-specific folders.
