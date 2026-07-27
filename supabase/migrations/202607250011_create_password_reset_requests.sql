create type public.password_reset_request_status as enum (
  'submitted',
  'completed',
  'rejected'
);

create table public.password_reset_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null,
  name text not null check (char_length(name) between 1 and 50),
  student_number text not null check (student_number ~ '^[0-9]+$'),
  phone_number text not null check (phone_number ~ '^01[0-9]{8,9}$'),
  reason text check (reason is null or char_length(reason) <= 500),
  status public.password_reset_request_status not null default 'submitted',
  reviewed_by uuid,
  reviewed_at timestamptz,
  admin_note text check (
    admin_note is null or char_length(admin_note) <= 500
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint password_reset_requests_requester_id_fkey
    foreign key (requester_id)
    references public.profiles (id)
    on delete cascade,
  constraint password_reset_requests_reviewed_by_fkey
    foreign key (reviewed_by)
    references public.profiles (id)
    on delete set null
);

create unique index password_reset_requests_one_submitted_per_user_idx
on public.password_reset_requests (requester_id)
where status = 'submitted';

create index password_reset_requests_status_created_at_idx
on public.password_reset_requests (status, created_at asc);

alter table public.password_reset_requests enable row level security;

revoke all on table public.password_reset_requests from anon, authenticated;
grant select on table public.password_reset_requests to authenticated;
grant all on table public.password_reset_requests to service_role;

create policy "Admins can read password reset requests"
on public.password_reset_requests
for select
to authenticated
using ((select public.is_admin()));

create trigger password_reset_requests_set_updated_at
  before update on public.password_reset_requests
  for each row execute procedure public.set_updated_at();

create or replace function public.create_password_reset_request(
  request_name text,
  request_student_number text,
  request_phone_number text,
  request_reason text default null
)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  target_profile public.profiles;
  request_id uuid;
  cleaned_name text := btrim(coalesce(request_name, ''));
  cleaned_student_number text :=
    btrim(coalesce(request_student_number, ''));
  cleaned_phone_number text :=
    regexp_replace(coalesce(request_phone_number, ''), '[^0-9]', '', 'g');
  cleaned_reason text :=
    nullif(btrim(coalesce(request_reason, '')), '');
begin
  if char_length(cleaned_name) not between 1 and 50
    or cleaned_student_number !~ '^[0-9]+$'
    or cleaned_phone_number !~ '^01[0-9]{8,9}$'
    or char_length(coalesce(cleaned_reason, '')) > 500
  then
    raise exception 'The password reset request is invalid.';
  end if;

  select *
  into target_profile
  from public.profiles
  where name = cleaned_name
    and student_number = cleaned_student_number
    and phone_number = cleaned_phone_number
    and approval_status = 'approved';

  if target_profile.id is null then
    raise exception 'The registered account information does not match.';
  end if;

  insert into public.password_reset_requests (
    requester_id,
    name,
    student_number,
    phone_number,
    reason
  )
  values (
    target_profile.id,
    target_profile.name,
    target_profile.student_number,
    target_profile.phone_number,
    cleaned_reason
  )
  on conflict (requester_id) where status = 'submitted'
  do update set
    name = excluded.name,
    student_number = excluded.student_number,
    phone_number = excluded.phone_number,
    reason = excluded.reason,
    created_at = now(),
    updated_at = now()
  returning id into request_id;

  return request_id;
end;
$$;

revoke all on function public.create_password_reset_request(
  text,
  text,
  text,
  text
) from public;
grant execute on function public.create_password_reset_request(
  text,
  text,
  text,
  text
) to anon, authenticated;
