-- Mobile registration is separate from public profiles, and does not grant messaging consent.
create table if not exists public.user_contact_numbers (
 user_id uuid primary key references auth.users(id) on delete cascade,
 phone_e164 text not null check (phone_e164 ~ '^[+]55[1-9][0-9]9[0-9]{8}$'),
 created_at timestamptz not null default now()
);
alter table public.user_contact_numbers enable row level security;
revoke all on public.user_contact_numbers from anon,authenticated;
grant select,insert,update,delete on public.user_contact_numbers to authenticated;
create policy "contact select self" on public.user_contact_numbers for select to authenticated using(user_id=(select auth.uid()));
create policy "contact insert self" on public.user_contact_numbers for insert to authenticated with check(user_id=(select auth.uid()));
create policy "contact update self" on public.user_contact_numbers for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy "contact delete self" on public.user_contact_numbers for delete to authenticated using(user_id=(select auth.uid()));

-- Applies to all creation entrypoints, including RPC/import. Existing records are unaffected.
create or replace function public.require_phone_for_additional_items()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.owner_id is distinct from (select auth.uid()) then
  raise exception 'item owner must match session' using errcode='42501';
 end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.owner_id::text,0));
 if exists(select 1 from public.items where owner_id=new.owner_id)
 and not exists(select 1 from public.user_contact_numbers where user_id=new.owner_id) then
  raise exception 'PHONE_REQUIRED' using errcode='P0001';
 end if;
 return new;
end;$$;
revoke all on function public.require_phone_for_additional_items() from public,anon,authenticated;
create trigger item_phone_requirement before insert on public.items
 for each row execute function public.require_phone_for_additional_items();
