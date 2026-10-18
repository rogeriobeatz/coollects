-- Coollects UX & public identity. REVIEW IN PREVIEW before applying to production.
-- This migration retains every previous handle as an alias, preserving existing URLs.
alter table public.profiles add column if not exists avatar_path text;

create table if not exists public.profile_username_aliases(
 username text primary key,
 profile_id uuid not null references public.profiles(id) on delete cascade,
 created_at timestamptz not null default now()
);
alter table public.profile_username_aliases enable row level security;
drop policy if exists "username_alias_read" on public.profile_username_aliases;
create policy "username_alias_read" on public.profile_username_aliases
for select to anon,authenticated using(true);

-- Preserve old links before changing a single account.
insert into public.profile_username_aliases(username,profile_id)
select username,id from public.profiles on conflict(username) do nothing;

create or replace function public.guard_profile_handle()
returns trigger language plpgsql security definer set search_path=public as $$
declare candidate text; base text; n integer := 1;
begin
 if TG_OP='INSERT' and new.username ~ '^col_[0-9a-f]{16,}$' then
  base := left(trim(both '-' from regexp_replace(
   translate(lower(coalesce(nullif(new.display_name,''),'colecionador')),
    'áàâãäéèêëíìîïóòôõöúùûüçñ','aaaaaeeeeiiiiooooouuuucn'),
   '[^a-z0-9]+','-','g')),24);
  if length(base)<3 then base:='colecionador'; end if;
  candidate:=base;
  while exists(select 1 from public.profiles where username=candidate)
    or exists(select 1 from public.profile_username_aliases where username=candidate) loop
   n:=n+1; candidate:=left(base,24)||'-'||n::text;
  end loop;
  new.username:=candidate;
 end if;
 if new.username !~ '^[a-z0-9_-]{3,30}$' then
  raise exception 'Nome de usuário inválido';
 end if;
 if exists(select 1 from public.profile_username_aliases where username=new.username and profile_id<>new.id) then
  raise exception 'Nome de usuário indisponível';
 end if;
 if TG_OP='UPDATE' and new.username is distinct from old.username then
  insert into public.profile_username_aliases(username,profile_id)
  values(old.username,new.id) on conflict(username) do nothing;
 end if;
 return new;
end $$;
drop trigger if exists guard_profile_handle_trigger on public.profiles;
create trigger guard_profile_handle_trigger
before insert or update of username on public.profiles
for each row execute function public.guard_profile_handle();

-- Transform only auto-generated legacy usernames; leave custom handles untouched.
do $$
declare person record; base text; candidate text; n integer;
begin
 for person in select id,display_name from public.profiles
 where username ~ '^col_[0-9a-f]{16,}$' order by id loop
  base:=left(trim(both '-' from regexp_replace(
   translate(lower(coalesce(nullif(person.display_name,''),'colecionador')),
    'áàâãäéèêëíìîïóòôõöúùûüçñ','aaaaaeeeeiiiiooooouuuucn'),
   '[^a-z0-9]+','-','g')),24);
  if length(base)<3 then base:='colecionador'; end if;
  candidate:=base; n:=1;
  while exists(select 1 from public.profiles where username=candidate and id<>person.id)
    or exists(select 1 from public.profile_username_aliases where username=candidate and profile_id<>person.id) loop
   n:=n+1; candidate:=left(base,24)||'-'||n::text;
  end loop;
  update public.profiles set username=candidate where id=person.id;
 end loop;
end $$;

-- Dedicated public avatar bucket; collectible photos remain private.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('coollects-avatars','coollects-avatars',true,2097152,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;
drop policy if exists "avatar_insert_owner" on storage.objects;
create policy "avatar_insert_owner" on storage.objects for insert to authenticated
with check(bucket_id='coollects-avatars' and split_part(name,'/',1)=auth.uid()::text);
drop policy if exists "avatar_delete_owner" on storage.objects;
create policy "avatar_delete_owner" on storage.objects for delete to authenticated
using(bucket_id='coollects-avatars' and split_part(name,'/',1)=auth.uid()::text);
