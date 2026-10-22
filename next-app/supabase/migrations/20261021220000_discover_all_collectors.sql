-- Every profile is discoverable, even when it has no collections or items.
-- Scores use visible items and likes on visible items; no private catalog data leaks.
create or replace function public.discover_collectors(
 p_query text default '',p_limit integer default 24,p_offset integer default 0
)
returns table(
 id uuid,username text,display_name text,bio text,
 followers bigint,public_items bigint,likes_received bigint,followed_by_me boolean
)
language sql stable security invoker set search_path=public,pg_temp as $$
 with lookup as (
  select lower(left(trim(both from regexp_replace(coalesce(p_query,''),'^@','','g')),100)) as term
 )
 select p.id,p.username,p.display_name,p.bio,
  numbers.followers,numbers.public_items,numbers.likes_received,
  exists(select 1 from public.user_follows f
    where f.follower_id=(select auth.uid()) and f.followed_id=p.id)
 from public.profiles p
 cross join lookup
 cross join lateral (
  select
   (select count(*) from public.user_follows f where f.followed_id=p.id) as followers,
   (select count(*) from public.items i where i.owner_id=p.id and private.item_is_public(i.id)) as public_items,
   (select count(*) from public.item_likes l join public.items i on i.id=l.item_id
    where i.owner_id=p.id and private.item_is_public(i.id)) as likes_received
 ) numbers
 where lookup.term='' or position(lookup.term in lower(p.username))>0
   or position(lookup.term in lower(p.display_name))>0
 order by
  case when lookup.term<>'' and lower(p.username)=lookup.term then 0
       when lookup.term<>'' and lower(p.username) like lookup.term||'%' then 1
       else 2 end,
  (numbers.public_items*4+numbers.likes_received*2+numbers.followers) desc,
  numbers.public_items desc,numbers.likes_received desc,numbers.followers desc,
  p.created_at desc,p.id
 limit least(greatest(coalesce(p_limit,24),1),48)
 offset greatest(coalesce(p_offset,0),0)
$$;

revoke all on function public.discover_collectors(text,integer,integer) from public,anon,authenticated;
grant execute on function public.discover_collectors(text,integer,integer) to anon,authenticated;

-- Home suggestions must include new collectors, too; the list excludes
-- self and followed users because those are already part of the home feed.
create or replace function public.suggested_collectors(p_limit integer default 12)
returns table(id uuid,username text,display_name text,bio text,followers bigint,public_items bigint)
language sql stable security invoker set search_path=public,pg_temp as $$
 select c.id,c.username,c.display_name,c.bio,c.followers,c.public_items
 from public.discover_collectors('',least(greatest(coalesce(p_limit,12),1)+200,48),0) c
 where c.id is distinct from (select auth.uid())
   and not c.followed_by_me
 limit least(greatest(coalesce(p_limit,12),1),30)
$$;
notify pgrst,'reload schema';
