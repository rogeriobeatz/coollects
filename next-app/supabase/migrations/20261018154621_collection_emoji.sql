-- Nullable so existing collections continue to use their category's emoji.
alter table public.collections
  add column emoji text
  constraint collections_emoji_length check (emoji is null or char_length(emoji) between 1 and 32);

comment on column public.collections.emoji is 'Optional custom collection emoji. NULL uses the category default.';
