-- New items and collections are public by default. Existing records keep
-- their previous visibility: old unassigned items remain private.
alter table public.collections alter column is_public set default true;
alter table public.items add column if not exists is_public boolean not null default false;
alter table public.items alter column is_public set default true;

create or replace function private.item_is_public(target_item uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(
  select 1 from public.items i
  where i.id=target_item and (
   i.is_public
   or exists(
    select 1 from public.collection_items ci
    join public.collections c on c.id=ci.collection_id
    where ci.item_id=i.id and c.is_public
   )
  )
 );
$$;
revoke all on function private.item_is_public(uuid) from public,anon,authenticated;
grant execute on function private.item_is_public(uuid) to anon,authenticated;

-- The public item predicate also governs signed URLs for primary/gallery photos.
drop policy if exists "read visible item images" on storage.objects;
create policy "read visible item images" on storage.objects for select
to anon,authenticated using (
 bucket_id='coollects-items'
 and (
  (storage.foldername(name))[1]=(select auth.uid())::text
  or exists(
   select 1 from public.items i
   where (i.photo_path=storage.objects.name or storage.objects.name=any(i.gallery_paths))
     and private.item_is_public(i.id)
  )
 )
);
notify pgrst, 'reload schema';
