-- Collector-centred social network: profile summary, connections, likes,
-- following feed, suggestions and activity.
-- Every function is SECURITY INVOKER: table RLS still decides what the caller
-- may see, and private.item_is_public() keeps private items out of public
-- lists, even for their owner. Safe to run more than once.

create index if not exists user_follows_followed_date on public.user_follows(followed_id,created_at desc);
create index if not exists user_follows_follower_date on public.user_follows(follower_id,created_at desc);
create index if not exists item_likes_user_date on public.item_likes(user_id,created_at desc);
create index if not exists item_likes_item_date on public.item_likes(item_id,created_at desc);

-- Keep social_profile_counts for already published clients during rollout.

-- Profile header: counters and the relation between the viewer and the profile.
create or replace function public.profile_social_summary(p_profile_id uuid)
returns table(
 followers bigint,following bigint,likes_received bigint,likes_given bigint,
 public_items bigint,public_collections bigint,
 followed_by_me boolean,follows_me boolean
)
language sql stable security invoker set search_path=public,pg_temp as $$
 select
  (select count(*) from public.user_follows f where f.followed_id=p_profile_id),
  (select count(*) from public.user_follows f where f.follower_id=p_profile_id),
  (select count(*) from public.item_likes l join public.items i on i.id=l.item_id
    where i.owner_id=p_profile_id and private.item_is_public(i.id)),
  (select count(*) from public.item_likes l
    where l.user_id=p_profile_id and private.item_is_public(l.item_id)),
  (select count(*) from public.items i where i.owner_id=p_profile_id and private.item_is_public(i.id)),
  (select count(*) from public.collections c where c.owner_id=p_profile_id and c.is_public),
  exists(select 1 from public.user_follows f where f.follower_id=(select auth.uid()) and f.followed_id=p_profile_id),
  exists(select 1 from public.user_follows f where f.follower_id=p_profile_id and f.followed_id=(select auth.uid()))
$$;

-- Likes for a list of cards in one request (at most 200 ids).
create or replace function public.item_social_summary(p_item_ids uuid[])
returns table(item_id uuid,likes bigint,liked_by_me boolean)
language sql stable security invoker set search_path=public,pg_temp as $$
 select i.id,
  (select count(*) from public.item_likes l where l.item_id=i.id),
  exists(select 1 from public.item_likes l where l.item_id=i.id and l.user_id=(select auth.uid()))
 from public.items i
 where i.id=any((coalesce(p_item_ids,array[]::uuid[]))[1:200])
$$;

-- Followers ('followers') or followed profiles ('following'), newest first.
create or replace function public.profile_connections(
 p_profile_id uuid,p_direction text default 'followers',p_limit int default 30,p_offset int default 0
)
returns table(id uuid,username text,display_name text,bio text,followed_by_me boolean,connected_at timestamptz)
language sql stable security invoker set search_path=public,pg_temp as $$
 select p.id,p.username,p.display_name,p.bio,
  exists(select 1 from public.user_follows m where m.follower_id=(select auth.uid()) and m.followed_id=p.id),
  f.created_at
 from public.user_follows f
 join public.profiles p on p.id=(case when p_direction='following' then f.followed_id else f.follower_id end)
 where (p_direction='following' and f.follower_id=p_profile_id)
    or (p_direction<>'following' and f.followed_id=p_profile_id)
 order by f.created_at desc,p.id
 limit least(greatest(coalesce(p_limit,30),1),60) offset greatest(coalesce(p_offset,0),0)
$$;

-- Who liked a visible item.
create or replace function public.item_likers(p_item_id uuid,p_limit int default 30,p_offset int default 0)
returns table(id uuid,username text,display_name text,bio text,followed_by_me boolean,connected_at timestamptz)
language sql stable security invoker set search_path=public,pg_temp as $$
 select p.id,p.username,p.display_name,p.bio,
  exists(select 1 from public.user_follows m where m.follower_id=(select auth.uid()) and m.followed_id=p.id),
  l.created_at
 from public.item_likes l
 join public.profiles p on p.id=l.user_id
 where l.item_id=p_item_id
 order by l.created_at desc,p.id
 limit least(greatest(coalesce(p_limit,30),1),60) offset greatest(coalesce(p_offset,0),0)
$$;

-- Public items of a collector, newest first.
create or replace function public.profile_public_items(p_profile_id uuid,p_limit int default 24,p_offset int default 0)
returns setof public.items
language sql stable security invoker set search_path=public,pg_temp as $$
 select i.* from public.items i
 where i.owner_id=p_profile_id and private.item_is_public(i.id)
 order by i.created_at desc,i.id
 limit least(greatest(coalesce(p_limit,24),1),60) offset greatest(coalesce(p_offset,0),0)
$$;

-- Public items a collector liked, most recent like first.
create or replace function public.profile_liked_items(p_profile_id uuid,p_limit int default 24,p_offset int default 0)
returns setof public.items
language sql stable security invoker set search_path=public,pg_temp as $$
 select i.* from public.item_likes l
 join public.items i on i.id=l.item_id
 where l.user_id=p_profile_id and private.item_is_public(i.id)
 order by l.created_at desc,i.id
 limit least(greatest(coalesce(p_limit,24),1),60) offset greatest(coalesce(p_offset,0),0)
$$;

-- Public items from the collectors the signed-in user follows.
create or replace function public.following_feed(p_limit int default 24,p_offset int default 0)
returns setof public.items
language sql stable security invoker set search_path=public,pg_temp as $$
 select i.* from public.items i
 where i.owner_id in (select f.followed_id from public.user_follows f where f.follower_id=(select auth.uid()))
   and private.item_is_public(i.id)
 order by i.created_at desc,i.id
 limit least(greatest(coalesce(p_limit,24),1),60) offset greatest(coalesce(p_offset,0),0)
$$;

-- Collectors with public collections the viewer does not follow yet.
create or replace function public.suggested_collectors(p_limit int default 12)
returns table(id uuid,username text,display_name text,bio text,followers bigint,public_items bigint)
language sql stable security invoker set search_path=public,pg_temp as $$
 select p.id,p.username,p.display_name,p.bio,
  (select count(*) from public.user_follows f where f.followed_id=p.id),
  (select count(*) from public.items i where i.owner_id=p.id and private.item_is_public(i.id))
 from public.profiles p
 where p.id is distinct from (select auth.uid())
   and exists(select 1 from public.collections c where c.owner_id=p.id and c.is_public)
   and not exists(select 1 from public.user_follows f where f.follower_id=(select auth.uid()) and f.followed_id=p.id)
 order by 5 desc,6 desc,p.created_at desc
 limit least(greatest(coalesce(p_limit,12),1),30)
$$;

-- New followers and likes received by the signed-in user.
create or replace function public.my_social_activity(p_limit int default 30)
returns table(kind text,actor_id uuid,username text,display_name text,item_id uuid,item_name text,happened_at timestamptz,followed_by_me boolean)
language sql stable security invoker set search_path=public,pg_temp as $$
 select a.* from (
  select 'follow'::text,p.id,p.username,p.display_name,null::uuid,null::text,f.created_at,
   exists(select 1 from public.user_follows m where m.follower_id=(select auth.uid()) and m.followed_id=p.id)
  from public.user_follows f join public.profiles p on p.id=f.follower_id
  where f.followed_id=(select auth.uid())
  union all
  select 'like'::text,p.id,p.username,p.display_name,i.id,i.name,l.created_at,
   exists(select 1 from public.user_follows m where m.follower_id=(select auth.uid()) and m.followed_id=p.id)
  from public.item_likes l
  join public.items i on i.id=l.item_id
  join public.profiles p on p.id=l.user_id
  where i.owner_id=(select auth.uid())
 ) a(kind,actor_id,username,display_name,item_id,item_name,happened_at,followed_by_me)
 order by a.happened_at desc
 limit least(greatest(coalesce(p_limit,30),1),60)
$$;

revoke all on function public.profile_social_summary(uuid) from public,anon,authenticated;
revoke all on function public.item_social_summary(uuid[]) from public,anon,authenticated;
revoke all on function public.profile_connections(uuid,text,int,int) from public,anon,authenticated;
revoke all on function public.item_likers(uuid,int,int) from public,anon,authenticated;
revoke all on function public.profile_public_items(uuid,int,int) from public,anon,authenticated;
revoke all on function public.profile_liked_items(uuid,int,int) from public,anon,authenticated;
revoke all on function public.following_feed(int,int) from public,anon,authenticated;
revoke all on function public.suggested_collectors(int) from public,anon,authenticated;
revoke all on function public.my_social_activity(int) from public,anon,authenticated;
grant execute on function public.profile_social_summary(uuid) to anon,authenticated;
grant execute on function public.item_social_summary(uuid[]) to anon,authenticated;
grant execute on function public.profile_connections(uuid,text,int,int) to anon,authenticated;
grant execute on function public.item_likers(uuid,int,int) to anon,authenticated;
grant execute on function public.profile_public_items(uuid,int,int) to anon,authenticated;
grant execute on function public.profile_liked_items(uuid,int,int) to anon,authenticated;
grant execute on function public.suggested_collectors(int) to anon,authenticated;
grant execute on function public.following_feed(int,int) to authenticated;
grant execute on function public.my_social_activity(int) to authenticated;

