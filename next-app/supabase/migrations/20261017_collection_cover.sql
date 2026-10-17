-- Phase 2: optional item cover. Apply to Supabase before releasing the matching frontend.
alter table public.collections
  add column if not exists cover_item_id uuid references public.items(id) on delete set null;

create or replace function public.validate_collection_cover_item()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
 if new.cover_item_id is not null and not exists (
  select 1 from public.collection_items ci
  join public.items i on i.id=ci.item_id
  where ci.collection_id=new.id and ci.item_id=new.cover_item_id and i.owner_id=new.owner_id
 ) then
  raise exception 'A capa deve ser um item pertencente a esta coleção';
 end if;
 return new;
end;
$$;
drop trigger if exists check_collection_cover_item on public.collections;
create trigger check_collection_cover_item before insert or update of cover_item_id
on public.collections for each row execute function public.validate_collection_cover_item();
