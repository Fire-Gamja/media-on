alter table public.pre_graduation_reservations
drop constraint if exists pre_graduation_reservations_student_key;

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

revoke all on function public.reserve_pre_graduation_slot(
  smallint,
  time
) from public;

grant execute on function public.reserve_pre_graduation_slot(
  smallint,
  time
) to authenticated;

create or replace function public.notify_admin_new_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  notification_title text;
  notification_body text;
  notification_route text;
  local_now timestamp := timezone('Asia/Seoul', now());
  operating_start time := time '09:00';
  operating_end time := time '17:00';
begin
  select start_time, end_time
  into operating_start, operating_end
  from public.operating_hours_settings
  where id = 1;

  if extract(isodow from local_now) not between 1 and 5
    or local_now::time < operating_start
    or local_now::time >= operating_end
  then
    return new;
  end if;

  if tg_table_name = 'equipment_rental_requests' then
    notification_title := '새 기자재 대여 신청';
    notification_body := '학생의 기자재 대여 신청이 접수되었습니다.';
    notification_route := '/admin-equipment-request?id=' || new.id;
  elsif tg_table_name = 'room_reservation_requests' then
    notification_title := '새 실습실 대여 신청';
    notification_body := '학생의 실습실 대여 신청이 접수되었습니다.';
    notification_route := '/admin-room-request?id=' || new.id;
  elsif tg_table_name = 'facility_reports' then
    notification_title := '새 시설 신고';
    notification_body := left(new.title, 120);
    notification_route := '/admin-facility-report?id=' || new.id;
  else
    notification_title := '새 조교 문의';
    notification_body := left(new.title, 120);
    notification_route := '/admin-assistant-inquiry?id=' || new.id;
  end if;

  insert into public.app_notifications (user_id, title, body, route)
  select
    id,
    notification_title,
    notification_body,
    notification_route
  from public.profiles
  where role = 'admin'
    and approval_status = 'approved';

  return new;
end;
$$;

revoke all on function public.notify_admin_new_request() from public;
