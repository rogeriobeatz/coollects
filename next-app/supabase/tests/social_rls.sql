-- Run as the database administrator. Every test record is rolled back.
-- Covers follows, likes and the social functions against private data leaks.
begin;
do $$
declare
 owner_user uuid := gen_random_uuid();
 fan_user uuid := gen_random_uuid();
 v_public uuid;
 v_private uuid;
 v_item uuid;
 v_hidden uuid;
 v_count bigint;
 failed boolean;
begin
 if has_table_privilege('anon','public.user_follows','TRUNCATE')
  or has_table_privilege('authenticated','public.user_follows','TRUNCATE')
  or has_table_privilege('anon','public.item_likes','TRUNCATE')
  or has_table_privilege('authenticated','public.item_likes','TRUNCATE')
 then raise exception 'Client roles can truncate social tables'; end if;
 insert into auth.users(id,aud,role,email) values
  (owner_user,'authenticated','authenticated','owner-'||owner_user||'@example.invalid'),
  (fan_user,'authenticated','authenticated','fan-'||fan_user||'@example.invalid');

 -- Owner: one public and one private item.
 perform set_config('request.jwt.claim.sub', owner_user::text, true);
 perform set_config('request.jwt.claims', json_build_object('sub',owner_user,'role','authenticated')::text, true);
 execute 'set local role authenticated';
 insert into public.collections(owner_id,name,category,is_public) values(owner_user,'Pública','Miniaturas',true) returning id into v_public;
 insert into public.collections(owner_id,name,category,is_public) values(owner_user,'Privada','Miniaturas',false) returning id into v_private;
 insert into public.items(owner_id,name,category) values(owner_user,'Visível','Miniaturas') returning id into v_item;
 insert into public.items(owner_id,name,category) values(owner_user,'Escondido','Miniaturas') returning id into v_hidden;
 insert into public.collection_items(collection_id,item_id) values(v_public,v_item),(v_private,v_hidden);
 if not exists(select 1 from public.home_feed(60,0) where id=v_item) then raise exception 'Owner misses own public item in feed'; end if;
 if exists(select 1 from public.home_feed(60,0) where id=v_hidden) then raise exception 'Owner sees private item in feed'; end if;

 failed:=false;
 begin insert into public.item_likes(user_id,item_id) values(owner_user,v_item); exception when others then failed:=true; end;
 if not failed then raise exception 'Owner can like their own item'; end if;
 failed:=false;
 begin insert into public.user_follows(follower_id,followed_id) values(owner_user,owner_user); exception when others then failed:=true; end;
 if not failed then raise exception 'A collector can follow themselves'; end if;

 -- Fan: can follow and like public items only.
 perform set_config('request.jwt.claim.sub', fan_user::text, true);
 perform set_config('request.jwt.claims', json_build_object('sub',fan_user,'role','authenticated')::text, true);
 insert into public.user_follows(follower_id,followed_id) values(fan_user,owner_user);
 insert into public.item_likes(user_id,item_id) values(fan_user,v_item);
 failed:=false;
 begin insert into public.item_likes(user_id,item_id) values(fan_user,v_hidden); exception when others then failed:=true; end;
 if not failed then raise exception 'A private item can be liked'; end if;
 failed:=false;
 begin insert into public.user_follows(follower_id,followed_id) values(owner_user,fan_user); exception when others then failed:=true; end;
 if not failed then raise exception 'A follow can be created on behalf of someone else'; end if;
 failed:=false;
 begin insert into public.item_likes(user_id,item_id) values(owner_user,v_item); exception when others then failed:=true; end;
 if not failed then raise exception 'A like can be created on behalf of someone else'; end if;

 select followers into v_count from public.profile_social_summary(owner_user);
 if v_count<>1 then raise exception 'Follower count is wrong'; end if;
 select public_items into v_count from public.profile_social_summary(owner_user);
 if v_count<>1 then raise exception 'Public item count includes private items'; end if;
 if not (select followed_by_me from public.profile_social_summary(owner_user)) then raise exception 'Relation is missing'; end if;
 if not exists(select 1 from public.profile_connections(owner_user,'followers',60,0) where id=fan_user) then raise exception 'Follower list is empty'; end if;
 if not exists(select 1 from public.profile_connections(fan_user,'following',60,0) where id=owner_user) then raise exception 'Following list is empty'; end if;
 if not exists(select 1 from public.item_likers(v_item,60,0) where id=fan_user) then raise exception 'Likers list is empty'; end if;
 if exists(select 1 from public.suggested_collectors(30) where id in (owner_user,fan_user)) then raise exception 'Suggestions include self or followed collector'; end if;
 if exists(select 1 from public.profile_public_items(owner_user,60,0) where id=v_hidden) then raise exception 'Private item in public gallery'; end if;
 if not exists(select 1 from public.home_feed(60,0) where id=v_item) then raise exception 'Feed misses a followed public item'; end if;
 if exists(select 1 from public.home_feed(60,0) where id=v_hidden) then raise exception 'Private item in the feed'; end if;
 if not exists(select 1 from public.community_feed(60,0) where id=v_item) then raise exception 'Community feed misses a public item'; end if;
 if not exists(select 1 from public.profile_liked_items(fan_user,60,0) where id=v_item) then raise exception 'Liked items tab is empty'; end if;

 -- The owner sees the like as activity; their private item stays out of public lists.
 perform set_config('request.jwt.claim.sub', owner_user::text, true);
 perform set_config('request.jwt.claims', json_build_object('sub',owner_user,'role','authenticated')::text, true);
 if (select count(*) from public.my_social_activity(30))<>2 then raise exception 'Activity must list one follow and one like'; end if;
 if exists(select 1 from public.profile_public_items(owner_user,60,0) where id=v_hidden) then raise exception 'Owner sees private item in public gallery'; end if;
 delete from public.user_follows where follower_id=fan_user and followed_id=owner_user;
 if not exists(select 1 from public.user_follows where follower_id=fan_user and followed_id=owner_user) then raise exception 'Owner can delete another collector follow'; end if;
 delete from public.item_likes where user_id=fan_user and item_id=v_item;
 if not exists(select 1 from public.item_likes where user_id=fan_user and item_id=v_item) then raise exception 'Owner can delete another collector like'; end if;

 -- Public readers see public social data but cannot write or read personal feeds.
 perform set_config('request.jwt.claim.sub', '', true);
 perform set_config('request.jwt.claims', '{"role":"anon"}', true);
 execute 'set local role anon';
 if not exists(select 1 from public.profile_public_items(owner_user,60,0) where id=v_item) then raise exception 'Anonymous public gallery is empty'; end if;
 if exists(select 1 from public.item_social_summary(array[v_hidden])) then raise exception 'Anonymous reader sees private item social data'; end if;
 failed:=false;
 begin perform public.home_feed(1,0); exception when insufficient_privilege then failed:=true; end;
 if not failed then raise exception 'Anonymous reader can execute personal feed'; end if;
 failed:=false;
 begin perform public.my_social_activity(1); exception when insufficient_privilege then failed:=true; end;
 if not failed then raise exception 'Anonymous reader can execute personal activity'; end if;
 failed:=false;
 begin insert into public.user_follows(follower_id,followed_id) values(owner_user,fan_user); exception when insufficient_privilege then failed:=true; end;
 if not failed then raise exception 'Anonymous reader can create a follow'; end if;
 execute 'set local role authenticated';
 perform set_config('request.jwt.claim.sub', owner_user::text, true);
 perform set_config('request.jwt.claims', json_build_object('sub',owner_user,'role','authenticated')::text, true);

 -- Making the collection private hides the item and its likes from everyone else.
 update public.collections set is_public=false where id=v_public;
 perform set_config('request.jwt.claim.sub', fan_user::text, true);
 perform set_config('request.jwt.claims', json_build_object('sub',fan_user,'role','authenticated')::text, true);
 if exists(select 1 from public.item_likes where item_id=v_item) then raise exception 'Likes of a private item are visible'; end if;
 if exists(select 1 from public.home_feed(60,0) where id in (v_item,v_hidden)) then raise exception 'Feed shows a private item'; end if;
 if exists(select 1 from public.community_feed(60,0) where id in (v_item,v_hidden)) then raise exception 'Community feed shows a private item'; end if;
 if exists(select 1 from public.profile_liked_items(fan_user,60,0) where id=v_item) then raise exception 'Private item remains in liked gallery'; end if;
 select likes_received into v_count from public.profile_social_summary(owner_user);
 if v_count<>0 then raise exception 'Likes of private items are counted'; end if;

 -- Unfollow and unlike only touch the caller's own rows.
 delete from public.user_follows where follower_id=fan_user and followed_id=owner_user;
 if exists(select 1 from public.user_follows where follower_id=fan_user) then raise exception 'Unfollow failed'; end if;

 -- Republish, then unlike: the owner's activity and the fan's favorites update.
 perform set_config('request.jwt.claim.sub', owner_user::text, true);
 perform set_config('request.jwt.claims', json_build_object('sub',owner_user,'role','authenticated')::text, true);
 update public.collections set is_public=true where id=v_public;
 perform set_config('request.jwt.claim.sub', fan_user::text, true);
 perform set_config('request.jwt.claims', json_build_object('sub',fan_user,'role','authenticated')::text, true);
 delete from public.item_likes where user_id=fan_user and item_id=v_item;
 if exists(select 1 from public.item_likes where user_id=fan_user and item_id=v_item) then raise exception 'Unlike failed'; end if;
 if exists(select 1 from public.profile_liked_items(fan_user,60,0) where id=v_item) then raise exception 'Unliked item remains in favorites'; end if;
 perform set_config('request.jwt.claim.sub', owner_user::text, true);
 perform set_config('request.jwt.claims', json_build_object('sub',owner_user,'role','authenticated')::text, true);
 if exists(select 1 from public.my_social_activity(30)) then raise exception 'Removed follows and likes remain in activity'; end if;
end $$;
rollback;
