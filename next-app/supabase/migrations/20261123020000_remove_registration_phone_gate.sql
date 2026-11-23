-- Development phase: phone number remains optional and must not block any item creation path.
drop trigger if exists item_phone_requirement on public.items;
drop function if exists public.require_phone_for_additional_items();
