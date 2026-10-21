-- Social graph and likes: visibility is checked on every write and read.
-- Follows and likes are public by design; private items never leak through them.
create table if not exists public.user_follows (
 follower_id uuid not null references public.profiles(id) on delete cascade,
 followed_id uuid not null references public.profiles(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key (follower_id,followed_id),
 constraint no_self_follow check (follower_id <> followed_id)
);
create index if not exists user_follows_followed on public.user_follows(followed_id);
alter table public.user_follows enable row level security;
drop policy if exists "follows visible" on public.user_follows;
create policy "follows visible" on public.user_follows for select to anon,authenticated using (true);
drop policy if exists "follow self" on public.user_follows;
create policy "follow self" on public.user_follows for insert to authenticated with check (follower_id=(select auth.uid()));
drop policy if exists "unfollow self" on public.user_follows;
create policy "unfollow self" on public.user_follows for delete to authenticated using (follower_id=(select auth.uid()));

create table if not exists public.item_likes (
 user_id uuid not null references public.profiles(id) on delete cascade,
 item_id uuid not null references public.items(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(user_id,item_id)
);
create index if not exists item_likes_item on public.item_likes(item_id);
alter table public.item_likes enable row level security;
-- Item visibility is checked again even when a like already exists.
drop policy if exists "likes on visible items" on public.item_likes;
create policy "likes on visible items" on public.item_likes for select to anon,authenticated
 using (exists(select 1 from public.items i where i.id=item_id));
-- Items RLS applies inside the subquery: only public items of other people can be liked.
drop policy if exists "like visible items" on public.item_likes;
create policy "like visible items" on public.item_likes for insert to authenticated
 with check(user_id=(select auth.uid()) and exists(
  select 1 from public.items i where i.id=item_id and i.owner_id<>(select auth.uid())
 ));
drop policy if exists "unlike own items" on public.item_likes;
drop policy if exists "remove own likes" on public.item_likes;
create policy "remove own likes" on public.item_likes for delete to authenticated
 using(user_id=(select auth.uid()));

-- Public counters cannot reveal private items. Uses invoker RLS visibility.
-- Superseded by public.profile_social_summary (20261021090000_social_network.sql).
create or replace function public.social_profile_counts(p_user_id uuid)
returns table(followers bigint,total_likes bigint)
language sql stable security invoker set search_path=public,pg_temp as $$
 select
  (select count(*) from public.user_follows f where f.followed_id=p_user_id),
  (select count(*) from public.item_likes l join public.items i on i.id=l.item_id
   where i.owner_id=p_user_id and exists(
    select 1 from public.collection_items ci join public.collections c on c.id=ci.collection_id
    where ci.item_id=i.id and c.is_public
   ))
$$;
grant execute on function public.social_profile_counts(uuid) to anon,authenticated;
