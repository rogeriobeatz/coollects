-- Home feed: chronological posts (public items) from the signed-in collector
-- and the people they follow, plus a community feed for empty timelines.
-- SECURITY INVOKER + private.item_is_public(): private items never appear,
-- not even the owner's own. Safe to run more than once.

-- Keep following_feed for already published clients during rollout.

create or replace function public.home_feed(p_limit int default 12,p_offset int default 0)
returns setof public.items
language sql stable security invoker set search_path=public,pg_temp as $$
 select i.* from public.items i
 where (select auth.uid()) is not null
   and (i.owner_id=(select auth.uid())
    or i.owner_id in (select f.followed_id from public.user_follows f where f.follower_id=(select auth.uid())))
   and private.item_is_public(i.id)
 order by i.created_at desc,i.id
 limit least(greatest(coalesce(p_limit,12),1),60) offset greatest(coalesce(p_offset,0),0)
$$;

-- Recent public items from everyone (except the viewer), for discovery.
create or replace function public.community_feed(p_limit int default 12,p_offset int default 0)
returns setof public.items
language sql stable security invoker set search_path=public,pg_temp as $$
 select i.* from public.items i
 where i.owner_id is distinct from (select auth.uid())
   and private.item_is_public(i.id)
 order by i.created_at desc,i.id
 limit least(greatest(coalesce(p_limit,12),1),60) offset greatest(coalesce(p_offset,0),0)
$$;

create index if not exists items_created_desc on public.items(created_at desc,id);

revoke all on function public.home_feed(int,int) from public,anon,authenticated;
revoke all on function public.community_feed(int,int) from public,anon,authenticated;
grant execute on function public.home_feed(int,int) to authenticated;
grant execute on function public.community_feed(int,int) to anon,authenticated;

