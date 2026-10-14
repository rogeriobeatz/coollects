-- Use a digest of the ENTIRE UUID, rather than a prefix, to avoid systematic collisions.
create or replace function public.on_new_user()
returns trigger language plpgsql security definer set search_path='' as $$
declare submitted_name text;
begin
 submitted_name:=trim(coalesce(new.raw_user_meta_data->>'display_name',''));
 insert into public.profiles(id,username,display_name)
 values(new.id,'col_'||substring(encode(extensions.digest(new.id::text,'sha256'),'hex'),1,26),
        case when char_length(submitted_name) between 2 and 60 then submitted_name else 'Colecionador' end)
 on conflict(id) do nothing;
 return new;
end;$$;
revoke all on function public.on_new_user() from public, anon, authenticated;