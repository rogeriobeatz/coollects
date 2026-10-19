-- Run as the database administrator. Every test record is rolled back.
begin;
do $$
declare
 owner_user uuid;
 other_user uuid := gen_random_uuid();
 v_collection_id uuid;
 v_item_id uuid;
 affected integer;
begin
 select id into owner_user from auth.users order by created_at limit 1;
 if owner_user is null then raise exception 'An existing account is required'; end if;
 perform set_config('request.jwt.claim.sub', owner_user::text, true);
 perform set_config('request.jwt.claims', json_build_object('sub',owner_user,'role','authenticated')::text, true);
 execute 'set local role authenticated';

 insert into public.collections(owner_id,name,category,color,emoji,is_public)
 values(owner_user,'Verificação CRUD','Miniaturas','#6125BF','🚀',false) returning id into v_collection_id;
 update public.collections set name='Coleção editada' where id=v_collection_id;
 if not exists(select 1 from public.collections where id=v_collection_id and name='Coleção editada') then
  raise exception 'Collection create/read/update failed';
 end if;
 v_item_id := public.create_item_with_details('Item de verificação','QA','Miniaturas','',null,array[v_collection_id],'{}'::jsonb);
 perform public.update_item_with_details(v_item_id,'Item editado','QA','Miniaturas','',null,array[v_collection_id],'{}'::jsonb);
 if not exists(select 1 from public.items where id=v_item_id and name='Item editado') then
  raise exception 'Item create/read/update failed';
 end if;

 perform set_config('request.jwt.claim.sub', other_user::text, true);
 perform set_config('request.jwt.claims', json_build_object('sub',other_user,'role','authenticated')::text, true);
 if exists(select 1 from public.collections where id=v_collection_id) or exists(select 1 from public.items where id=v_item_id) then
  raise exception 'Another account can read private records';
 end if;
 update public.collections set name='Forbidden' where id=v_collection_id;
 get diagnostics affected=row_count;
 if affected<>0 then raise exception 'Another account can update the collection'; end if;
 delete from public.items where id=v_item_id;
 get diagnostics affected=row_count;
 if affected<>0 then raise exception 'Another account can delete the item'; end if;

 perform set_config('request.jwt.claim.sub', owner_user::text, true);
 perform set_config('request.jwt.claims', json_build_object('sub',owner_user,'role','authenticated')::text, true);
 delete from public.collections where id=v_collection_id;
 if exists(select 1 from public.collections where id=v_collection_id) or not exists(select 1 from public.items where id=v_item_id) then
  raise exception 'Collection deletion must preserve its items';
 end if;
 insert into public.collections(owner_id,name,category,is_public)
 values(owner_user,'Coleção preservada','Miniaturas',false) returning id into v_collection_id;
 insert into public.collection_items(collection_id,item_id) values(v_collection_id,v_item_id);
 delete from public.items where id=v_item_id;
 if exists(select 1 from public.items where id=v_item_id) then raise exception 'Item deletion failed'; end if;
 if not exists(select 1 from public.collections where id=v_collection_id)
  or exists(select 1 from public.collection_items ci where ci.collection_id=v_collection_id) then
  raise exception 'Item deletion must preserve the collection and remove only its links';
 end if;
end $$;
rollback;
