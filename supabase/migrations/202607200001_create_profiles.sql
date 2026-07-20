create type public.user_role as enum ('student', 'admin');
create type public.approval_status as enum (
  'pending',
  'approved',
  'rejected'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  student_number text not null unique
    check (student_number ~ '^[0-9]+$'),
  name text not null,
  grade smallint not null check (grade between 1 and 4),
  major text not null,
  enrollment_status text not null,
  phone_number text not null check (phone_number ~ '^01[0-9]{8,9}$'),
  role public.user_role not null default 'student',
  approval_status public.approval_status not null default 'pending',
  privacy_agreed boolean not null default false,
  terms_agreed boolean not null default false,
  marketing_agreed boolean not null default false,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant all on table public.profiles to service_role;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  metadata jsonb := new.raw_user_meta_data;
  parsed_grade smallint;
begin
  if coalesce(metadata ->> 'student_number', '') = '' then
    return new;
  end if;

  if metadata ->> 'grade' not in ('1', '2', '3', '4') then
    raise exception 'A grade from 1 to 4 is required.';
  end if;

  parsed_grade := (metadata ->> 'grade')::smallint;

  insert into public.profiles (
    id,
    student_number,
    name,
    grade,
    major,
    enrollment_status,
    phone_number,
    privacy_agreed,
    terms_agreed,
    marketing_agreed
  )
  values (
    new.id,
    metadata ->> 'student_number',
    metadata ->> 'name',
    parsed_grade,
    metadata ->> 'major',
    metadata ->> 'enrollment_status',
    metadata ->> 'phone_number',
    coalesce((metadata ->> 'privacy_agreed')::boolean, false),
    coalesce((metadata ->> 'terms_agreed')::boolean, false),
    coalesce((metadata ->> 'marketing_agreed')::boolean, false)
  );

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
      and approval_status = 'approved'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create policy "Students can read their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "Admins can read all profiles"
on public.profiles
for select
to authenticated
using ((select public.is_admin()));

create or replace function public.review_student_account(
  target_user_id uuid,
  decision public.approval_status
)
returns public.profiles
language plpgsql
security definer set search_path = ''
as $$
declare
  reviewed_profile public.profiles;
begin
  if not public.is_admin() then
    raise exception 'Administrator permission is required.'
      using errcode = '42501';
  end if;

  if decision = 'pending' then
    raise exception 'The review decision must be approved or rejected.';
  end if;

  update public.profiles
  set
    approval_status = decision,
    reviewed_by = (select auth.uid()),
    reviewed_at = now(),
    updated_at = now()
  where id = target_user_id
  returning * into reviewed_profile;

  if reviewed_profile.id is null then
    raise exception 'The requested profile does not exist.';
  end if;

  return reviewed_profile;
end;
$$;

revoke all on function public.review_student_account(
  uuid,
  public.approval_status
) from public;
grant execute on function public.review_student_account(
  uuid,
  public.approval_status
) to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();
