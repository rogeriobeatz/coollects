-- Revoke API execute access to auth trigger's SECURITY DEFINER function.
revoke all on function public.on_new_user() from public, anon, authenticated;
-- Authenticated users may consume their own scan quota, protected by auth.uid().
revoke all on function public.consume_scan_quota() from public, anon;
grant execute on function public.consume_scan_quota() to authenticated;
