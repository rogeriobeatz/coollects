-- Extra photos per item. photo_path stays the main photo (the one analyzed by
-- the AI and used on cards); gallery_paths holds up to 4 additional photos.
alter table public.items
 add column if not exists gallery_paths text[] not null default '{}';

alter table public.items drop constraint if exists items_gallery_paths_max;
alter table public.items add constraint items_gallery_paths_max
 check (cardinality(gallery_paths) <= 4);

-- Every gallery file must live in the owner's own Storage folder.
create or replace function private.validate_item_gallery()
returns trigger language plpgsql set search_path='' as $$
begin
 if exists(
  select 1 from unnest(new.gallery_paths) path
  where path is null or path not like new.owner_id::text||'/%'
 ) then
  raise exception 'gallery photo outside owner folder' using errcode='42501';
 end if;
 return new;
end;$$;
revoke all on function private.validate_item_gallery() from public, anon, authenticated;

drop trigger if exists items_validate_gallery on public.items;
create trigger items_validate_gallery
 before insert or update of gallery_paths, owner_id on public.items
 for each row execute function private.validate_item_gallery();

-- Public collections must also expose their items' extra photos.
drop policy if exists "read visible item images" on storage.objects;
create policy "read visible item images" on storage.objects for select to anon,authenticated using(
 bucket_id='coollects-items' and (
 (storage.foldername(name))[1]=(select auth.uid())::text
 or exists (
  select 1 from public.items i
  join public.collection_items ci on ci.item_id=i.id
  join public.collections c on c.id=ci.collection_id
  where (i.photo_path=storage.objects.name or storage.objects.name=any(i.gallery_paths)) and c.is_public
 )
 )
);

-- Create item + details + collections + gallery in a single transaction.
create or replace function public.create_item_with_gallery(
 p_name text,p_brand text,p_category text,p_notes text,p_photo_path text,
 p_collection_ids uuid[],p_details jsonb,p_gallery_paths text[]
) returns uuid language plpgsql security invoker set search_path=public,pg_temp as $$
declare new_id uuid;
begin
 select public.create_item_with_details(
  p_name,p_brand,p_category,p_notes,p_photo_path,p_collection_ids,p_details
 )::text::uuid into new_id;
 update public.items set gallery_paths=coalesce(p_gallery_paths,'{}')
 where id=new_id and owner_id=(select auth.uid());
 return new_id;
end;$$;
revoke all on function public.create_item_with_gallery(text,text,text,text,text,uuid[],jsonb,text[]) from public,anon,authenticated;
grant execute on function public.create_item_with_gallery(text,text,text,text,text,uuid[],jsonb,text[]) to authenticated;
