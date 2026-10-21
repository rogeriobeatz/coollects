-- Human-readable usernames for new collectors; existing profile URLs are preserved.
-- Priority: normalized display name -> normalized email local-part -> stable short suffix.
-- Runs in the auth.users insert trigger; uniqueness remains enforced by profiles_username_key.

create or replace function private.username_slug(raw_value text)
returns text language sql immutable set search_path = '' as $$
 select trim(both '_' from left(
  pg_catalog.regexp_replace(
   pg_catalog.translate(pg_catalog.lower(coalesce(raw_value,'')),
    'áàâãäåāăąçćčďđéèêëēėęěğíìîïīįłñńňóòôõöøōőřśšşťţúùûüūůűýÿźżž',
    'aaaaaaaaacccddeeeeeeeegiiiiiilnnnoooooooorsssttuuuuuuuyyzzz'),
   '[^a-z0-9]+', '_', 'g'), 30))
$$;

-- Only the profile-creation trigger needs this internal helper.
revoke all on function private.username_slug(text) from public, anon, authenticated;

create or replace function public.on_new_user()
returns trigger
language plpgsql security definer set search_path = '' as $$
declare
 submitted_name text;
 name_candidate text;
 email_candidate text;
 root_candidate text;
 candidate text;
 suffix text;
 fingerprint text;
 attempt integer;
 inserted_id uuid;
begin
 submitted_name := pg_catalog.btrim(coalesce(new.raw_user_meta_data->>'display_name',''));
 name_candidate := private.username_slug(submitted_name);
 email_candidate := private.username_slug(pg_catalog.split_part(coalesce(new.email,''),'@',1));

 if pg_catalog.char_length(name_candidate)<3 then name_candidate := null; end if;
 if pg_catalog.char_length(email_candidate)<3 then email_candidate := null; end if;
 root_candidate := coalesce(name_candidate,email_candidate,'colecionador');
 fingerprint := pg_catalog.encode(extensions.digest(new.id::text,'sha256'),'hex');

 -- Each attempt is atomic. ON CONFLICT DO NOTHING tolerates names claimed
 -- concurrently; the following candidate is tried without aborting sign-up.
 for attempt in 1..20 loop
  if attempt = 1 then
   candidate := name_candidate;
  elsif attempt = 2 then
   candidate := email_candidate;
  elsif attempt < 20 then
   suffix := pg_catalog.substring(fingerprint,1,attempt+1);
   candidate := pg_catalog.left(root_candidate,29-pg_catalog.char_length(suffix)) || '_' || suffix;
  else
   -- Equivalent strength to our previous opaque fallback (26 hex digits).
   candidate := 'col_' || pg_catalog.substring(fingerprint,1,26);
  end if;

  if candidate is null or pg_catalog.char_length(candidate)<3 then continue; end if;

  insert into public.profiles (id,username,display_name)
  values (
   new.id,candidate,
   case when pg_catalog.char_length(submitted_name) between 2 and 60 then submitted_name else 'Colecionador' end
  )
  on conflict do nothing
  returning id into inserted_id;

  if inserted_id is not null then return new; end if;
  if exists(select 1 from public.profiles p where p.id=new.id) then return new; end if;
 end loop;

 raise exception 'Unable to allocate a unique username for new account';
end;
$$;

revoke all on function public.on_new_user() from public, anon, authenticated;
-- No update of existing usernames or profiles. No frontend field required.
