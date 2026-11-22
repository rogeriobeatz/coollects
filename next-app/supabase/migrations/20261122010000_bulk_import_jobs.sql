-- Durable, resumable bulk import. All client-visible rows are owner-scoped.
create table if not exists public.bulk_import_jobs (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 status text not null default 'queued' check(status in ('queued','processing','review','completed','partial','failed')),
 total_count integer not null check(total_count between 1 and 100),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.bulk_import_items (
 id uuid primary key default gen_random_uuid(),
 job_id uuid not null references public.bulk_import_jobs(id) on delete cascade,
 owner_id uuid not null references auth.users(id) on delete cascade,
 photo_path text not null,
 status text not null default 'queued' check(status in ('queued','processing','ready','failed','saved')),
 suggestion jsonb,
 error_message text,
 attempts integer not null default 0 check(attempts between 0 and 3),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(job_id,photo_path),
 check(photo_path like owner_id::text || '/%')
);
create index if not exists bulk_import_items_queue_idx on public.bulk_import_items(status,created_at) where status in ('queued','processing');
create index if not exists bulk_import_items_job_idx on public.bulk_import_items(job_id,created_at);
alter table public.bulk_import_jobs enable row level security;
alter table public.bulk_import_items enable row level security;
grant select on public.bulk_import_jobs,public.bulk_import_items to authenticated;
create policy "owners read bulk import jobs" on public.bulk_import_jobs for select to authenticated using(owner_id=(select auth.uid()));
create policy "owners read bulk import items" on public.bulk_import_items for select to authenticated using(owner_id=(select auth.uid()));

-- Create the job and its photo rows in one transaction, under the caller's RLS identity.
create or replace function public.create_bulk_import_job(p_photo_paths text[])
returns uuid language plpgsql security invoker set search_path=public,pg_temp as $$
declare v_job uuid; v_owner uuid := (select auth.uid());
begin
 if v_owner is null then raise exception 'authentication required' using errcode='42501'; end if;
 if p_photo_paths is null or cardinality(p_photo_paths)<1 or cardinality(p_photo_paths)>100 then
  raise exception 'bulk import accepts 1 to 100 photos' using errcode='22023';
 end if;
 if exists(select 1 from unnest(p_photo_paths) p where p is null or p not like v_owner::text||'/%') then
  raise exception 'invalid photo path' using errcode='42501';
 end if;
 if cardinality(p_photo_paths)<>(select count(distinct p) from unnest(p_photo_paths) p) then
  raise exception 'duplicate photo path' using errcode='22023';
 end if;
 insert into public.bulk_import_jobs(owner_id,total_count) values(v_owner,cardinality(p_photo_paths)) returning id into v_job;
 insert into public.bulk_import_items(job_id,owner_id,photo_path)
 select v_job,v_owner,p from unnest(p_photo_paths) p;
 return v_job;
end;$$;
revoke all on function public.create_bulk_import_job(text[]) from public,anon;
grant execute on function public.create_bulk_import_job(text[]) to authenticated;

-- Internal queue claim: a short lease prevents concurrent workers from claiming the same photo.
create or replace function public.claim_bulk_import_items(p_limit integer default 2)
returns setof public.bulk_import_items language plpgsql security definer set search_path=public,pg_temp as $$
begin
 return query
 with picked as (
  select id from public.bulk_import_items
  where (status='queued' or (status='processing' and updated_at<now()-interval '5 minutes'))
    and attempts<3
  order by created_at
  for update skip locked
  limit greatest(1,least(coalesce(p_limit,2),3))
 ), claimed as (
  update public.bulk_import_items i
  set status='processing',attempts=i.attempts+1,updated_at=now()
  from picked where i.id=picked.id
  returning i.*
 )
 select * from claimed;
end;$$;
revoke all on function public.claim_bulk_import_items(integer) from public,anon,authenticated;
grant execute on function public.claim_bulk_import_items(integer) to service_role;

create or replace function public.finish_bulk_import_item(p_item_id uuid,p_suggestion jsonb,p_error text default null)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare v_job uuid;
begin
 update public.bulk_import_items
 set status=case when p_error is null then 'ready' else case when attempts>=3 then 'failed' else 'queued' end end,
     suggestion=case when p_error is null then p_suggestion else null end,
     error_message=case when p_error is null then null else left(p_error,240) end,
     updated_at=now()
 where id=p_item_id and status='processing'
 returning job_id into v_job;
 if v_job is not null then
  update public.bulk_import_jobs j set
   status=case
    when not exists(select 1 from public.bulk_import_items i where i.job_id=v_job and i.status in ('queued','processing')) then
      case when exists(select 1 from public.bulk_import_items i where i.job_id=v_job and i.status='failed') then 'partial' else 'review' end
    else 'processing' end,
   updated_at=now()
  where j.id=v_job;
 end if;
end;$$;
revoke all on function public.finish_bulk_import_item(uuid,jsonb,text) from public,anon,authenticated;
grant execute on function public.finish_bulk_import_item(uuid,jsonb,text) to service_role;

-- Saving an item and marking its import row saved are one transaction: retries cannot duplicate it.
create or replace function public.save_bulk_import_item(
 p_bulk_item_id uuid,p_name text,p_brand text,p_category text,p_notes text,p_collection_ids uuid[],p_details jsonb
) returns uuid language plpgsql security invoker set search_path=public,pg_temp as $$
declare v_item public.bulk_import_items; v_saved uuid;
begin
 select * into v_item from public.bulk_import_items where id=p_bulk_item_id and owner_id=(select auth.uid()) for update;
 if not found then raise exception 'bulk import item not found' using errcode='42501'; end if;
 if v_item.status='saved' then raise exception 'bulk import item already saved' using errcode='23505'; end if;
 if v_item.status<>'ready' then raise exception 'bulk import item is not ready' using errcode='22023'; end if;
 select public.create_item_with_details(p_name,p_brand,p_category,p_notes,v_item.photo_path,p_collection_ids,p_details)
 into v_saved;
 update public.bulk_import_items set status='saved',updated_at=now() where id=p_bulk_item_id;
 if not exists(select 1 from public.bulk_import_items where job_id=v_item.job_id and status<>'saved') then
  update public.bulk_import_jobs set status='completed',updated_at=now() where id=v_item.job_id;
 end if;
 return v_saved;
end;$$;
revoke all on function public.save_bulk_import_item(uuid,text,text,text,text,uuid[],jsonb) from public,anon;
grant execute on function public.save_bulk_import_item(uuid,text,text,text,text,uuid[],jsonb) to authenticated;
