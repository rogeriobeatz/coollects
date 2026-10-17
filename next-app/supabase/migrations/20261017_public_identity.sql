-- Phase 3: persistent public identity and avatar storage.
alter table public.profiles add column if not exists avatar_path text;
create table if not exists public.profile_username_aliases (
 username text primary key,
 profile_id uuid not null references public.profiles(id) on delete cascade,
 created_at timestamptz not null default now()
);
alter table public.profile_username_aliases enable row level security;
drop policy if exists "Aliases are publicly readable" on public.profile_username_aliases;
create policy "Aliases are publicly readable" on public.profile_username_aliases for select to anon,authenticated using(true);

create or replace function public.profile_username_guard() returns trigger
language plpgsql security definer set search_path=public as $$
begin
 if new.username !~ '^[a-z0-9_-]{3,30}$' then raise exception 'Nome de usuário inválido'; end if;
 if exists(select 1 from public.profile_username_aliases where username=new.username and profile_id<>new.id) then
  raise exception 'Nome de usuário indisponível';
 end if;
 if tg_op='UPDATE' and old.username is distinct from new.username then
  insert into public.profile_username_aliases(username,profile_id)
  values(old.username,new.id) on conflict(username) do nothing;
 end if;
 return new;
end; $$;
drop trigger if exists profile_username_guard_trigger on public.profiles;
create trigger profile_username_guard_trigger before insert or update of username
on public.profiles for each row execute function public.profile_username_guard();

-- Save all current public links before migrating legacy handles.
insert into public.profile_username_aliases(username,profile_id)
select username,id from public.profiles on conflict(username) do nothing;

-- Deterministic slugs with a short suffix only if needed. Retains every old handle as an alias.
with names as (
 select p.id, left(trim(both '-' from regexp_replace(
  translate(lower(coalesce(nullif(p.display_name,''),'colecionador')),
  'áàâãäéèêëíìîïóòôõöúùûüçñ','aaaaaeeeeiiiiooooouuuucn'),
  '[^a-z0-9]+','-','g')),22) as raw
 from public.profiles p where p.username like 'col_%'
), candidates as (
 select n.id, case when length(n.raw)>=3 then n.raw else 'colecionador' end as slug from names n
), numbered as (
 select id,slug,row_number() over(partition by slug order by id) as rn from candidates
)
update public.profiles p set username=left(n.slug,20)||'-'||substr(replace(p.id::text,'-',''),1,6)
from numbered n where p.id=n.id;

-- Separate public avatar bucket; unlike private collectible photos, avatars are intentionally public.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('coollects-avatars','coollects-avatars',true,2097152,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true,file_size_limit=2097152,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
drop policy if exists "Avatar upload by owner" on storage.objects;
create policy "Avatar upload by owner" on storage.objects for insert to authenticated
with check(bucket_id='coollects-avatars' and split_part(name,'/',1)=auth.uid()::text);
drop policy if exists "Avatar deletion by owner" on storage.objects;
create policy "Avatar deletion by owner" on storage.objects for delete to authenticated
using(bucket_id='coollects-avatars' and split_part(name,'/',1)=auth.uid()::text);
