-- Release integrity: break circular RLS dependencies and ensure atomic relationships.
-- Internal helpers run with elevated privileges but only return booleans.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create or replace function private.item_is_public(target_item uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(
  select 1 from public.collection_items link
  join public.collections c on c.id=link.collection_id
  where link.item_id=target_item and c.is_public
 );
$$;
create or replace function private.current_user_owns_item(target_item uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(
  select 1 from public.items i
  where i.id=target_item and i.owner_id=(select auth.uid())
 );
$$;
revoke all on function private.item_is_public(uuid) from public, anon, authenticated;
grant execute on function private.item_is_public(uuid) to anon,authenticated;
revoke all on function private.current_user_owns_item(uuid) from public, anon, authenticated;
grant execute on function private.current_user_owns_item(uuid) to authenticated;

drop policy if exists "items read" on public.items;
create policy "items read" on public.items for select to anon,authenticated
 using(owner_id=(select auth.uid()) or (select private.item_is_public(id)));

drop policy if exists "links insert" on public.collection_items;
create policy "links insert" on public.collection_items for insert to authenticated
 with check(
  (select private.current_user_owns_item(item_id)) and
  exists(select 1 from public.collections c where c.id=collection_id and c.owner_id=(select auth.uid()))
 );

-- Anonymous user signup remains automatic; ensure generated usernames practically unique.
create or replace function public.on_new_user()
returns trigger language plpgsql security definer set search_path='' as $$
declare submitted_name text;
begin
 submitted_name:=trim(coalesce(new.raw_user_meta_data->>'display_name',''));
 insert into public.profiles(id,username,display_name)
 values(new.id,'col_'||substring(replace(new.id::text,'-',''),1,26),
        case when char_length(submitted_name) between 2 and 60 then submitted_name else 'Colecionador' end)
 on conflict(id) do nothing;
 return new;
end;$$;
revoke all on function public.on_new_user() from public, anon, authenticated;

-- All association replacements run in one PostgreSQL transaction.
create or replace function public.replace_item_collections(p_item_id uuid,p_collection_ids uuid[])
returns void language plpgsql security invoker set search_path=public,pg_temp as $$
declare wanted uuid[];
begin
 if (select auth.uid()) is null or not exists(
   select 1 from public.items i where i.id=p_item_id and i.owner_id=(select auth.uid())
 ) then
   raise exception 'item not owned' using errcode='42501';
 end if;
 wanted := array(select distinct unnest(coalesce(p_collection_ids, array[]::uuid[])));
 if coalesce(array_length(wanted,1),0)>30 then
   raise exception 'too many collections' using errcode='22023';
 end if;
 if exists(
   select 1 from unnest(wanted) wid
   left join public.collections c on c.id=wid and c.owner_id=(select auth.uid())
   where c.id is null
 ) then
   raise exception 'collection not owned' using errcode='42501';
 end if;
 delete from public.collection_items where item_id=p_item_id;
 insert into public.collection_items(collection_id,item_id)
 select distinct cid,p_item_id from unnest(wanted) cid;
end;$$;
revoke all on function public.replace_item_collections(uuid,uuid[]) from public,anon,authenticated;
grant execute on function public.replace_item_collections(uuid,uuid[]) to authenticated;
