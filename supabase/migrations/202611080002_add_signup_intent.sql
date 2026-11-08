alter table public.profiles
  add column if not exists signup_intent text not null default 'future_seller'
  check (signup_intent in ('seller', 'future_seller'));

create or replace function public.handle_new_user() returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  insert into public.profiles(id, full_name, signup_intent)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    case
      when new.raw_user_meta_data->>'signup_intent' = 'seller' then 'seller'
      else 'future_seller'
    end
  );
  return new;
end
$$;
