create or replace function public.update_my_avatar(next_avatar_url text)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  updated_profile public.profiles;
begin
  if current_user_id is null then
    raise exception 'Authentication is required.'
      using errcode = '42501';
  end if;

  if next_avatar_url is null
    or length(trim(next_avatar_url)) = 0
    or length(next_avatar_url) > 2000
  then
    raise exception 'A valid avatar URL is required.';
  end if;

  update public.profiles
  set avatar_url = trim(next_avatar_url)
  where id = current_user_id
  returning * into updated_profile;

  if updated_profile.id is null then
    raise exception 'The profile does not exist.';
  end if;

  return updated_profile;
end;
$$;

revoke all on function public.update_my_avatar(text) from public;
grant execute on function public.update_my_avatar(text) to authenticated;
