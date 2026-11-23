-- Idempotent item creation: a retry after a lost HTTP response returns the
-- original item instead of inserting a duplicate.
alter table public.items add column if not exists creation_request_id uuid;
create unique index if not exists items_owner_creation_request_uidx
  on public.items(owner_id, creation_request_id)
  where creation_request_id is not null;

create or replace function public.create_item_idempotent(
 p_request_id uuid,
 p_name text,p_brand text,p_category text,p_notes text,p_photo_path text,
 p_collection_ids uuid[],p_details jsonb,p_gallery_paths text[] default '{}'
) returns uuid
language plpgsql security invoker set search_path=public,pg_temp as $$
declare
 v_owner uuid := (select auth.uid());
 v_saved_id uuid;
 v_gallery text[] := coalesce(p_gallery_paths,'{}');
begin
 if v_owner is null then raise exception 'authentication required' using errcode='42501'; end if;
 if p_request_id is null then raise exception 'request id required' using errcode='22023'; end if;
 if nullif(trim(coalesce(p_name,'')),'') is null then raise exception 'item name required' using errcode='22023'; end if;
 if p_photo_path is not null and p_photo_path not like v_owner::text||'/%' then
  raise exception 'photo belongs to another account' using errcode='42501';
 end if;
 if cardinality(v_gallery)>4 or exists(select 1 from unnest(v_gallery) p where p is null or p not like v_owner::text||'/%') then
  raise exception 'invalid gallery paths' using errcode='42501';
 end if;
 if p_details is null or jsonb_typeof(p_details)<>'object' or pg_column_size(p_details)>8192 then
  raise exception 'invalid item details' using errcode='22023';
 end if;

 insert into public.items(owner_id,name,brand,category,notes,photo_path,details,gallery_paths,creation_request_id)
 values(v_owner,trim(p_name),coalesce(trim(p_brand),''),p_category,coalesce(trim(p_notes),''),p_photo_path,p_details,v_gallery,p_request_id)
 on conflict (owner_id,creation_request_id) where creation_request_id is not null do nothing
 returning id into v_saved_id;

 if v_saved_id is not null then
  perform public.replace_item_collections(v_saved_id,p_collection_ids);
  return v_saved_id;
 end if;

 select id into v_saved_id from public.items
 where owner_id=v_owner and creation_request_id=p_request_id;
 if v_saved_id is null then raise exception 'could not resolve idempotent item' using errcode='40001'; end if;
 return v_saved_id;
end;
$$;
revoke all on function public.create_item_idempotent(uuid,text,text,text,text,text,uuid[],jsonb,text[]) from public,anon;
grant execute on function public.create_item_idempotent(uuid,text,text,text,text,text,uuid[],jsonb,text[]) to authenticated;