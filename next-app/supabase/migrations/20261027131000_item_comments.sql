-- Comments on publicly visible collectibles. No phone or email data exposed.
create table if not exists public.item_comments (
 id uuid primary key default gen_random_uuid(),
 item_id uuid not null references public.items(id) on delete cascade,
 author_id uuid not null references auth.users(id) on delete cascade,
 body text not null check(char_length(btrim(body)) between 1 and 280 and body=btrim(body)),
 created_at timestamptz not null default now()
);
create index if not exists item_comments_item_date on public.item_comments(item_id,created_at desc,id desc);
create index if not exists item_comments_author_date on public.item_comments(author_id,created_at desc);
alter table public.item_comments enable row level security;
revoke all on public.item_comments from anon,authenticated;
grant select on public.item_comments to anon,authenticated;
grant insert,delete on public.item_comments to authenticated;
create policy "comments visible on public items" on public.item_comments for select to anon,authenticated
 using((select private.item_is_public(item_id)));
create policy "comment on public item as self" on public.item_comments for insert to authenticated
 with check(author_id=(select auth.uid()) and (select private.item_is_public(item_id)));
create policy "comment deletion by author or item owner" on public.item_comments for delete to authenticated
 using(author_id=(select auth.uid()) or exists(select 1 from public.items i where i.id=item_id and i.owner_id=(select auth.uid())));
-- Avoid bursts of multiple comments from the same account on the same item.
create or replace function public.limit_item_comment_rate()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if exists(select 1 from public.item_comments c where c.author_id=new.author_id and c.item_id=new.item_id and c.created_at>now()-interval '5 seconds') then
  raise exception 'Please wait before commenting again' using errcode='P0001';
 end if;
 return new;
end;$$;
revoke all on function public.limit_item_comment_rate() from public,anon,authenticated;
create trigger item_comment_rate_limit before insert on public.item_comments
 for each row execute function public.limit_item_comment_rate();
