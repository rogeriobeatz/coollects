-- Item metadata and collection membership must commit or roll back together.
-- SECURITY INVOKER: all table RLS checks still apply.
create or replace function public.create_item_with_collections(
 p_name text,p_brand text,p_category text,p_notes text,p_photo_path text,p_collection_ids uuid[]
) returns uuid language plpgsql security invoker set search_path=public,pg_temp as $$
declare saved_id uuid;
begin
 if (select auth.uid()) is null then
  raise exception 'authentication required' using errcode='42501';
 end if;
 if nullif(trim(coalesce(p_name,'')),'') is null then
  raise exception 'item name required' using errcode='22023';
 end if;
 if p_photo_path is not null and p_photo_path not like (select auth.uid())::text||'/%' then
  raise exception 'photo path belongs to another account' using errcode='42501';
 end if;
 insert into public.items(owner_id,name,brand,category,notes,photo_path)
 values((select auth.uid()),trim(p_name),coalesce(trim(p_brand),''),p_category,coalesce(trim(p_notes),''),p_photo_path)
 returning id into saved_id;
 perform public.replace_item_collections(saved_id,p_collection_ids);
 return saved_id;
end;$$;

create or replace function public.update_item_with_collections(
 p_item_id uuid,p_name text,p_brand text,p_category text,p_notes text,p_photo_path text,p_collection_ids uuid[]
) returns void language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 if (select auth.uid()) is null or nullif(trim(coalesce(p_name,'')),'') is null then
  raise exception 'invalid item or session' using errcode='22023';
 end if;
 if p_photo_path is not null and p_photo_path not like (select auth.uid())::text||'/%' then
  raise exception 'photo path belongs to another account' using errcode='42501';
 end if;
 update public.items
 set name=trim(p_name),brand=coalesce(trim(p_brand),''),category=p_category,
 notes=coalesce(trim(p_notes),''),photo_path=p_photo_path
 where id=p_item_id and owner_id=(select auth.uid());
 if not found then raise exception 'item not found or not owned' using errcode='42501'; end if;
 perform public.replace_item_collections(p_item_id,p_collection_ids);
end;$$;

revoke all on function public.create_item_with_collections(text,text,text,text,text,uuid[]) from public,anon,authenticated;
grant execute on function public.create_item_with_collections(text,text,text,text,text,uuid[]) to authenticated;
revoke all on function public.update_item_with_collections(uuid,text,text,text,text,text,uuid[]) from public,anon,authenticated;
grant execute on function public.update_item_with_collections(uuid,text,text,text,text,text,uuid[]) to authenticated;
