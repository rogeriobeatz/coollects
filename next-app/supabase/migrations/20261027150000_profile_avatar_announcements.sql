-- Public collector avatars are opt-in profile photos, never private item images.
alter table public.profiles add column if not exists avatar_path text
 check (avatar_path is null or (avatar_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}[.](webp|jpg|png)$' and avatar_path like id::text || '/%'));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('coollects-avatars','coollects-avatars',true,614400,array['image/webp','image/jpeg','image/png'])
on conflict(id) do update set public=true,file_size_limit=614400,allowed_mime_types=excluded.allowed_mime_types;
create policy "avatar upload self" on storage.objects for insert to authenticated
 with check(bucket_id='coollects-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "avatar read public" on storage.objects for select to anon,authenticated
 using(bucket_id='coollects-avatars');
create policy "avatar delete self" on storage.objects for delete to authenticated
 using(bucket_id='coollects-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
-- Release announcements are acknowledged per user, across browsers and devices.
create table public.user_announcements_seen(
 user_id uuid not null references auth.users(id) on delete cascade,
 announcement_key text not null check (char_length(announcement_key) between 1 and 80),
 seen_at timestamptz not null default now(),
 primary key(user_id,announcement_key)
);
alter table public.user_announcements_seen enable row level security;
grant select,insert on public.user_announcements_seen to authenticated;
create policy "own announcements read" on public.user_announcements_seen for select to authenticated using(user_id=(select auth.uid()));
create policy "own announcements insert" on public.user_announcements_seen for insert to authenticated with check(user_id=(select auth.uid()));
