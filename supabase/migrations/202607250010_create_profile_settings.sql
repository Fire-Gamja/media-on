create or replace function public.update_my_profile(
  profile_name text,
  profile_grade smallint,
  profile_major text,
  profile_enrollment_status text,
  profile_phone_number text
)
returns public.profiles
language plpgsql
security definer set search_path = ''
as $$
declare
  updated_profile public.profiles;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication is required.'
      using errcode = '42501';
  end if;

  if coalesce(btrim(profile_name), '') = '' then
    raise exception 'A profile name is required.';
  end if;

  if profile_grade not between 1 and 4 then
    raise exception 'A grade from 1 to 4 is required.';
  end if;

  if profile_major not in (
    '영상미디어전공',
    '멀티미디어전공',
    '전공 미정'
  ) then
    raise exception 'A supported major is required.';
  end if;

  if profile_grade = 1 and profile_major <> '전공 미정' then
    raise exception 'First-year students must use the undecided major.';
  end if;

  if profile_grade > 1 and profile_major = '전공 미정' then
    raise exception 'Students in grades 2 through 4 must select a major.';
  end if;

  if profile_enrollment_status not in (
    '재학',
    '휴학',
    '졸업',
    '제적·자퇴'
  ) then
    raise exception 'A supported enrollment status is required.';
  end if;

  if profile_phone_number !~ '^01[0-9]{8,9}$' then
    raise exception 'A valid mobile phone number is required.';
  end if;

  update public.profiles
  set
    name = btrim(profile_name),
    grade = profile_grade,
    major = profile_major,
    enrollment_status = profile_enrollment_status,
    phone_number = profile_phone_number
  where id = (select auth.uid())
  returning * into updated_profile;

  if updated_profile.id is null then
    raise exception 'The requested profile does not exist.';
  end if;

  return updated_profile;
end;
$$;

revoke all on function public.update_my_profile(
  text,
  smallint,
  text,
  text,
  text
) from public;
grant execute on function public.update_my_profile(
  text,
  smallint,
  text,
  text,
  text
) to authenticated;
