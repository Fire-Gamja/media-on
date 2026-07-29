create table public.pre_graduation_settings (
  id smallint primary key default 1 check (id = 1),
  access_enabled boolean not null default false,
  enabled_weekdays smallint[] not null default array[]::smallint[]
    check (
      enabled_weekdays <@ array[1, 2, 3, 4, 5]::smallint[]
    ),
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.pre_graduation_settings (
  id,
  access_enabled,
  enabled_weekdays
)
values (
  1,
  false,
  array[]::smallint[]
)
on conflict (id) do nothing;

alter table public.pre_graduation_settings enable row level security;

revoke all on table public.pre_graduation_settings from anon, authenticated;
grant select on table public.pre_graduation_settings to authenticated;
grant all on table public.pre_graduation_settings to service_role;

create policy "Authenticated users can read pre graduation settings"
on public.pre_graduation_settings
for select
to authenticated
using (true);

create table public.pre_graduation_reservations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null
    references public.profiles (id) on delete cascade,
  weekday smallint not null check (weekday between 1 and 5),
  start_time time not null check (
    start_time >= time '10:20'
    and start_time <= time '16:00'
    and mod(
      extract(
        epoch from (start_time - time '10:20')
      )::integer,
      1200
    ) = 0
  ),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint pre_graduation_reservations_student_key
    unique (student_id),
  constraint pre_graduation_reservations_slot_key
    unique (weekday, start_time)
);

create index pre_graduation_reservations_slot_idx
on public.pre_graduation_reservations (weekday, start_time);

alter table public.pre_graduation_reservations enable row level security;

revoke all on table public.pre_graduation_reservations
from anon, authenticated;
grant all on table public.pre_graduation_reservations to service_role;

create trigger pre_graduation_settings_set_updated_at
  before update on public.pre_graduation_settings
  for each row execute procedure public.set_updated_at();

create trigger pre_graduation_reservations_set_updated_at
  before update on public.pre_graduation_reservations
  for each row execute procedure public.set_updated_at();

create or replace function public.update_pre_graduation_settings(
  next_access_enabled boolean,
  next_enabled_weekdays smallint[]
)
returns public.pre_graduation_settings
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  normalized_weekdays smallint[];
  updated_settings public.pre_graduation_settings;
begin
  if current_user_id is null or not public.is_admin() then
    raise exception 'Administrator permission is required.'
      using errcode = '42501';
  end if;

  if exists (
    select 1
    from unnest(
      coalesce(next_enabled_weekdays, array[]::smallint[])
    ) as requested_weekday
    where requested_weekday not between 1 and 5
  ) then
    raise exception 'PRE_GRADUATION_INVALID_WEEKDAY';
  end if;

  select coalesce(
    array_agg(distinct requested_weekday order by requested_weekday),
    array[]::smallint[]
  )
  into normalized_weekdays
  from unnest(
    coalesce(next_enabled_weekdays, array[]::smallint[])
  ) as requested_weekday;

  if next_access_enabled and cardinality(normalized_weekdays) = 0 then
    raise exception 'PRE_GRADUATION_WEEKDAY_REQUIRED';
  end if;

  update public.pre_graduation_settings
  set
    access_enabled = next_access_enabled,
    enabled_weekdays = normalized_weekdays,
    updated_by = current_user_id,
    updated_at = now()
  where id = 1
  returning * into updated_settings;

  return updated_settings;
end;
$$;

create or replace function public.get_pre_graduation_schedule()
returns table (
  weekday smallint,
  slot_start time,
  slot_end time,
  reservation_id uuid,
  student_name text,
  student_number text,
  is_mine boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_profile public.profiles%rowtype;
  current_settings public.pre_graduation_settings%rowtype;
begin
  if current_user_id is null then
    raise exception 'Authentication is required.'
      using errcode = '42501';
  end if;

  select *
  into current_profile
  from public.profiles
  where id = current_user_id;

  if not found or current_profile.approval_status <> 'approved' then
    raise exception 'Approved account permission is required.'
      using errcode = '42501';
  end if;

  select *
  into current_settings
  from public.pre_graduation_settings
  where id = 1;

  if current_profile.role <> 'admin' then
    if current_profile.grade <> 4 then
      raise exception 'PRE_GRADUATION_GRADE_RESTRICTED'
        using errcode = '42501';
    end if;

    if not current_settings.access_enabled then
      raise exception 'PRE_GRADUATION_ACCESS_CLOSED'
        using errcode = '42501';
    end if;
  end if;

  return query
  with slots as (
    select
      day_number::smallint as weekday,
      generated_slot::time as slot_start,
      (generated_slot + interval '20 minutes')::time as slot_end
    from generate_series(1, 5) as day_number
    cross join generate_series(
      timestamp '2000-01-01 10:20',
      timestamp '2000-01-01 16:00',
      interval '20 minutes'
    ) as generated_slot
  )
  select
    slots.weekday,
    slots.slot_start,
    slots.slot_end,
    reservation.id,
    profile.name,
    case
      when current_profile.role = 'admin' then profile.student_number
      else null
    end,
    coalesce(reservation.student_id = current_user_id, false)
  from slots
  left join public.pre_graduation_reservations as reservation
    on reservation.weekday = slots.weekday
    and reservation.start_time = slots.slot_start
  left join public.profiles as profile
    on profile.id = reservation.student_id
  order by slots.weekday, slots.slot_start;
end;
$$;

create or replace function public.reserve_pre_graduation_slot(
  requested_weekday smallint,
  requested_start_time time
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_profile public.profiles%rowtype;
  current_settings public.pre_graduation_settings%rowtype;
  created_reservation_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication is required.'
      using errcode = '42501';
  end if;

  select *
  into current_profile
  from public.profiles
  where id = current_user_id;

  if not found
    or current_profile.role <> 'student'
    or current_profile.approval_status <> 'approved'
    or current_profile.grade <> 4
  then
    raise exception 'PRE_GRADUATION_GRADE_RESTRICTED'
      using errcode = '42501';
  end if;

  select *
  into current_settings
  from public.pre_graduation_settings
  where id = 1
  for update;

  if not current_settings.access_enabled then
    raise exception 'PRE_GRADUATION_ACCESS_CLOSED'
      using errcode = '42501';
  end if;

  if requested_weekday is null
    or not requested_weekday = any(current_settings.enabled_weekdays)
  then
    raise exception 'PRE_GRADUATION_WEEKDAY_CLOSED';
  end if;

  if requested_start_time is null
    or requested_start_time < time '10:20'
    or requested_start_time > time '16:00'
    or mod(
      extract(
        epoch from (requested_start_time - time '10:20')
      )::integer,
      1200
    ) <> 0
  then
    raise exception 'PRE_GRADUATION_INVALID_TIME';
  end if;

  if exists (
    select 1
    from public.pre_graduation_reservations
    where student_id = current_user_id
  ) then
    raise exception 'PRE_GRADUATION_ALREADY_RESERVED';
  end if;

  if exists (
    select 1
    from public.pre_graduation_reservations
    where weekday = requested_weekday
      and start_time = requested_start_time
  ) then
    raise exception 'PRE_GRADUATION_SLOT_TAKEN';
  end if;

  insert into public.pre_graduation_reservations (
    student_id,
    weekday,
    start_time
  )
  values (
    current_user_id,
    requested_weekday,
    requested_start_time
  )
  returning id into created_reservation_id;

  return created_reservation_id;
exception
  when unique_violation then
    raise exception 'PRE_GRADUATION_SLOT_TAKEN';
end;
$$;

create or replace function public.cancel_pre_graduation_reservation(
  target_reservation_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'Authentication is required.'
      using errcode = '42501';
  end if;

  delete from public.pre_graduation_reservations
  where id = target_reservation_id
    and (
      student_id = current_user_id
      or public.is_admin()
    );

  if not found then
    raise exception 'PRE_GRADUATION_RESERVATION_NOT_FOUND';
  end if;
end;
$$;

revoke all on function public.update_pre_graduation_settings(
  boolean,
  smallint[]
) from public;
revoke all on function public.get_pre_graduation_schedule() from public;
revoke all on function public.reserve_pre_graduation_slot(
  smallint,
  time
) from public;
revoke all on function public.cancel_pre_graduation_reservation(uuid)
from public;

grant execute on function public.update_pre_graduation_settings(
  boolean,
  smallint[]
) to authenticated;
grant execute on function public.get_pre_graduation_schedule()
to authenticated;
grant execute on function public.reserve_pre_graduation_slot(
  smallint,
  time
) to authenticated;
grant execute on function public.cancel_pre_graduation_reservation(uuid)
to authenticated;
