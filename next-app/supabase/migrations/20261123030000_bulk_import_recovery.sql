-- Durable recovery and explicit retry for bulk recognition.
alter table public.bulk_import_items
  add column if not exists raw_response text;

alter table public.bulk_import_items
  drop constraint if exists bulk_import_items_attempts_check;

-- Attempts are diagnostic only; they do not impose a user-facing or technical hard cap.
create or replace function public.claim_bulk_import_items(p_limit integer default 2)
returns setof public.bulk_import_items
language plpgsql security definer set search_path=public,pg_temp as $$
begin
  return query
  with picked as (
    select id from public.bulk_import_items
    where status='queued'
       or (status='processing' and updated_at < now()-interval '5 minutes')
    order by created_at
    for update skip locked
    limit greatest(1,least(coalesce(p_limit,2),3))
  ), claimed as (
    update public.bulk_import_items i
    set status='processing', attempts=i.attempts+1, updated_at=now()
    from picked where i.id=picked.id
    returning i.*
  )
  select * from claimed;
end;
$$;

create or replace function public.finish_bulk_import_item(
  p_item_id uuid, p_suggestion jsonb, p_error text default null
) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_job uuid;
begin
  update public.bulk_import_items
  set status=case when p_error is null then 'ready' else 'failed' end,
      suggestion=case when p_error is null then p_suggestion else null end,
      error_message=case when p_error is null then null else left(p_error,240) end,
      updated_at=now()
  where id=p_item_id and status='processing'
  returning job_id into v_job;

  if v_job is not null then
    update public.bulk_import_jobs j set
      status=case
        when exists(select 1 from public.bulk_import_items i where i.job_id=v_job and i.status in ('queued','processing')) then 'processing'
        when exists(select 1 from public.bulk_import_items i where i.job_id=v_job and i.status='failed') then 'partial'
        else 'review' end,
      updated_at=now()
    where j.id=v_job;
  end if;
end;
$$;

create or replace function public.retry_bulk_import_item(p_item_id uuid)
returns void
language plpgsql security definer set search_path=public,pg_temp as $
declare v_job uuid; v_owner uuid := (select auth.uid());
begin
  if v_owner is null then raise exception 'authentication required' using errcode='42501'; end if;
  update public.bulk_import_items
  set status='queued', error_message=null, updated_at=now()
  where id=p_item_id
    and owner_id=v_owner
    and status='failed'
  returning job_id into v_job;

  if v_job is null then
    raise exception 'item is not retryable or does not belong to user' using errcode='42501';
  end if;

  update public.bulk_import_jobs set status='queued', updated_at=now()
  where id=v_job and owner_id=(select auth.uid());
end;
$$;

revoke all on function public.retry_bulk_import_item(uuid) from public,anon;
grant execute on function public.retry_bulk_import_item(uuid) to authenticated;
