alter table public.pre_graduation_settings
add column if not exists enabled_dates date[] not null default array[]::date[];

alter table public.pre_graduation_settings
drop constraint if exists pre_graduation_settings_enabled_weekdays_check;

alter table public.pre_graduation_settings
add constraint pre_graduation_settings_enabled_weekdays_check check (
  enabled_weekdays <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[]
);

update public.pre_graduation_settings
set enabled_dates = (
  select coalesce(
    array_agg(
      case requested_weekday
        when 1 then date '2026-09-07'
        when 2 then date '2026-09-01'
        when 3 then date '2026-09-02'
        when 4 then date '2026-09-03'
        when 5 then date '2026-09-04'
      end
      order by requested_weekday
    ),
    array[]::date[]
  )
  from unnest(enabled_weekdays) as requested_weekday
)
where cardinality(enabled_dates) = 0;

alter table public.pre_graduation_reservations
add column if not exists reservation_date date;

alter table public.pre_graduation_reservations
drop constraint if exists pre_graduation_reservations_weekday_check;

alter table public.pre_graduation_reservations
add constraint pre_graduation_reservations_weekday_check check (
  weekday between 1 and 7
);

update public.pre_graduation_reservations
set reservation_date = case weekday
  when 1 then date '2026-09-07'
  when 2 then date '2026-09-01'
  when 3 then date '2026-09-02'
  when 4 then date '2026-09-03'
  when 5 then date '2026-09-04'
end
where reservation_date is null;

alter table public.pre_graduation_reservations
alter column reservation_date set not null;

alter table public.pre_graduation_reservations
drop constraint if exists pre_graduation_reservations_slot_key;

alter table public.pre_graduation_reservations
drop constraint if exists pre_graduation_reservations_start_time_check;

alter table public.pre_graduation_reservations
add constraint pre_graduation_reservations_start_time_check check (
  start_time >= time '10:00'
  and start_time <= time '17:40'
  and not (start_time >= time '12:00' and start_time < time '13:00')
  and mod(
    extract(epoch from (start_time - time '10:00'))::integer,
    1200
  ) = 0
);

alter table public.pre_graduation_reservations
add constraint pre_graduation_reservations_date_slot_key
unique (reservation_date, start_time);

create index if not exists pre_graduation_reservations_date_slot_idx
on public.pre_graduation_reservations (reservation_date, start_time);

drop function if exists public.update_pre_graduation_settings(boolean, smallint[]);
drop function if exists public.get_pre_graduation_schedule();
drop function if exists public.reserve_pre_graduation_slot(smallint, time);

create function public.update_pre_graduation_settings(
  next_access_enabled boolean,
  next_enabled_dates date[]
)
returns public.pre_graduation_settings
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  normalized_dates date[];
  updated_settings public.pre_graduation_settings;
begin
  if current_user_id is null or not public.is_admin() then
    raise exception 'Administrator permission is required.'
      using errcode = '42501';
  end if;

  select coalesce(
    array_agg(distinct requested_date order by requested_date),
    array[]::date[]
  )
  into normalized_dates
  from unnest(coalesce(next_enabled_dates, array[]::date[])) as requested_date;

  if next_access_enabled and cardinality(normalized_dates) = 0 then
    raise exception 'PRE_GRADUATION_DATE_REQUIRED';
  end if;

  update public.pre_graduation_settings
  set
    access_enabled = next_access_enabled,
    enabled_dates = normalized_dates,
    enabled_weekdays = array(
      select distinct extract(isodow from date_value)::smallint
      from unnest(normalized_dates) as date_value
      order by 1
    ),
    updated_by = current_user_id,
    updated_at = now()
  where id = 1
  returning * into updated_settings;

  return updated_settings;
end;
$$;

create function public.get_pre_graduation_schedule()
returns table (
  reservation_date date,
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
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  select * into current_profile
  from public.profiles
  where id = current_user_id;

  if not found or current_profile.approval_status <> 'approved' then
    raise exception 'Approved account permission is required.' using errcode = '42501';
  end if;

  select * into current_settings
  from public.pre_graduation_settings
  where id = 1;

  if current_profile.role <> 'admin' then
    if current_profile.grade <> 4 then
      raise exception 'PRE_GRADUATION_GRADE_RESTRICTED' using errcode = '42501';
    end if;
    if not current_settings.access_enabled then
      raise exception 'PRE_GRADUATION_ACCESS_CLOSED' using errcode = '42501';
    end if;
  end if;

  return query
  with slots as (
    select
      requested_date as reservation_date,
      extract(isodow from requested_date)::smallint as weekday,
      generated_slot::time as slot_start,
      (generated_slot + interval '20 minutes')::time as slot_end
    from unnest(current_settings.enabled_dates) as requested_date
    cross join generate_series(
      timestamp '2000-01-01 10:00',
      timestamp '2000-01-01 17:40',
      interval '20 minutes'
    ) as generated_slot
    where generated_slot::time < time '12:00'
      or generated_slot::time >= time '13:00'
  )
  select
    slots.reservation_date,
    slots.weekday,
    slots.slot_start,
    slots.slot_end,
    reservation.id,
    profile.name,
    case when current_profile.role = 'admin' then profile.student_number else null end,
    coalesce(reservation.student_id = current_user_id, false)
  from slots
  left join public.pre_graduation_reservations as reservation
    on reservation.reservation_date = slots.reservation_date
    and reservation.start_time = slots.slot_start
  left join public.profiles as profile
    on profile.id = reservation.student_id
  order by slots.reservation_date, slots.slot_start;
end;
$$;

create function public.reserve_pre_graduation_slot(
  requested_reservation_date date,
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
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  select * into current_profile
  from public.profiles
  where id = current_user_id;

  if not found
    or current_profile.role <> 'student'
    or current_profile.approval_status <> 'approved'
    or current_profile.grade <> 4
  then
    raise exception 'PRE_GRADUATION_GRADE_RESTRICTED' using errcode = '42501';
  end if;

  select * into current_settings
  from public.pre_graduation_settings
  where id = 1
  for update;

  if not current_settings.access_enabled then
    raise exception 'PRE_GRADUATION_ACCESS_CLOSED' using errcode = '42501';
  end if;

  if requested_reservation_date is null
    or not requested_reservation_date = any(current_settings.enabled_dates)
  then
    raise exception 'PRE_GRADUATION_DATE_CLOSED';
  end if;

  if requested_start_time is null
    or requested_start_time < time '10:00'
    or requested_start_time > time '17:40'
    or (requested_start_time >= time '12:00' and requested_start_time < time '13:00')
    or mod(
      extract(epoch from (requested_start_time - time '10:00'))::integer,
      1200
    ) <> 0
  then
    raise exception 'PRE_GRADUATION_INVALID_TIME';
  end if;

  if exists (
    select 1
    from public.pre_graduation_reservations
    where reservation_date = requested_reservation_date
      and start_time = requested_start_time
  ) then
    raise exception 'PRE_GRADUATION_SLOT_TAKEN';
  end if;

  insert into public.pre_graduation_reservations (
    student_id,
    weekday,
    reservation_date,
    start_time
  ) values (
    current_user_id,
    extract(isodow from requested_reservation_date)::smallint,
    requested_reservation_date,
    requested_start_time
  )
  returning id into created_reservation_id;

  return created_reservation_id;
exception
  when unique_violation then
    raise exception 'PRE_GRADUATION_SLOT_TAKEN';
end;
$$;

revoke all on function public.update_pre_graduation_settings(boolean, date[]) from public;
revoke all on function public.get_pre_graduation_schedule() from public;
revoke all on function public.reserve_pre_graduation_slot(date, time) from public;

grant execute on function public.update_pre_graduation_settings(boolean, date[]) to authenticated;
grant execute on function public.get_pre_graduation_schedule() to authenticated;
grant execute on function public.reserve_pre_graduation_slot(date, time) to authenticated;
