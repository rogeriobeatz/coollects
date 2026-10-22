-- Read-only inspection after the public-item-defaults migration.
select table_name,column_default from information_schema.columns
where table_schema='public' and table_name in ('items','collections')
  and column_name='is_public';
select pg_get_functiondef('private.item_is_public(uuid)'::regprocedure)
  like '%i.is_public%' as standalone_public_items_enabled;
select pg_get_expr(polqual,polrelid) like '%item_is_public%' as storage_media_policy_updated
from pg_policy where polname='read visible item images'
  and polrelid='storage.objects'::regclass;
