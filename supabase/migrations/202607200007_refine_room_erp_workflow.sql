drop function if exists public.transition_room_reservation_request(
  uuid,
  public.room_reservation_status,
  text
);

drop policy if exists "Approved users can create their own room reservations"
on public.room_reservation_requests;

alter table public.room_reservation_requests
  alter column status drop default;

alter type public.room_reservation_status
  rename to room_reservation_status_old;

create type public.room_reservation_status as enum (
  'submitted',
  'received',
  'erp_checking',
  'approved',
  'rejected'
);

alter table public.room_reservation_requests
  alter column status type public.room_reservation_status
  using (
    case
      when status::text = 'completed' then 'approved'
      else status::text
    end
  )::public.room_reservation_status;

alter table public.room_reservation_requests
  alter column status set default 'submitted';

drop type public.room_reservation_status_old;

update public.practice_rooms
set name = '제 1자연관 301호', location = '제 1자연관 301호'
where name = '301호 미디어 실습실';

update public.practice_rooms
set name = '제 1자연관 501호', location = '제 1자연관 501호'
where name = '501호 편집 실습실';

update public.practice_rooms
set capacity = 40;

alter table public.practice_rooms
  add constraint practice_rooms_capacity_fixed_check check (capacity = 40);

insert into public.practice_rooms (
  name,
  location,
  capacity,
  open_time,
  close_time,
  description
)
values
  ('제 1자연관 101호', '제 1자연관 101호', 40, '09:00', '17:00', '통합정보시스템 실습실 대여 신청 확인 대상 실습실'),
  ('제 1자연관 301호', '제 1자연관 301호', 40, '09:00', '17:00', '통합정보시스템 실습실 대여 신청 확인 대상 실습실'),
  ('제 1자연관 501호', '제 1자연관 501호', 40, '09:00', '17:00', '통합정보시스템 실습실 대여 신청 확인 대상 실습실'),
  ('제 1자연관 303호', '제 1자연관 303호', 40, '09:00', '17:00', '통합정보시스템 실습실 대여 신청 확인 대상 실습실'),
  ('제 1자연관 304호', '제 1자연관 304호', 40, '09:00', '17:00', '통합정보시스템 실습실 대여 신청 확인 대상 실습실'),
  ('제 1자연관 504호', '제 1자연관 504호', 40, '09:00', '17:00', '통합정보시스템 실습실 대여 신청 확인 대상 실습실')
on conflict (name) do update
set
  location = excluded.location,
  capacity = 40,
  description = excluded.description,
  is_active = true;

create policy "Approved users can create their own room reservations"
on public.room_reservation_requests
for insert
to authenticated
with check (
  requester_id = (select auth.uid())
  and (select public.is_approved_user())
  and status = 'submitted'
  and reservation_date >= current_date
  and attendee_count = 40
  and start_time >= (
    select open_time
    from public.practice_rooms
    where id = room_id and is_active
  )
  and end_time <= (
    select close_time
    from public.practice_rooms
    where id = room_id and is_active
  )
);

create or replace function public.transition_room_reservation_request(
  target_request_id uuid,
  new_status public.room_reservation_status,
  note text default null
)
returns public.room_reservation_requests
language plpgsql
security definer set search_path = ''
as $$
declare
  current_request public.room_reservation_requests;
  updated_request public.room_reservation_requests;
  selected_room public.practice_rooms;
  conflicting_count integer;
  cleaned_note text := nullif(btrim(coalesce(note, '')), '');
begin
  if not public.is_admin() then
    raise exception 'Administrator permission is required.'
      using errcode = '42501';
  end if;

  if char_length(coalesce(note, '')) > 2000 then
    raise exception 'The administrator note must be 2000 characters or fewer.';
  end if;

  select *
  into current_request
  from public.room_reservation_requests
  where id = target_request_id
  for update;

  if current_request.id is null then
    raise exception 'The room reservation request does not exist.';
  end if;

  if not (
    (current_request.status = 'submitted' and new_status in ('received', 'rejected'))
    or (current_request.status = 'received' and new_status in ('erp_checking', 'rejected'))
    or (current_request.status = 'erp_checking' and new_status in ('approved', 'rejected'))
  ) then
    raise exception 'The requested room reservation status transition is not allowed.';
  end if;

  if new_status = 'rejected' and cleaned_note is null then
    raise exception 'A rejection reason is required.';
  end if;

  if new_status = 'approved' then
    select *
    into selected_room
    from public.practice_rooms
    where id = current_request.room_id and is_active
    for update;

    if selected_room.id is null then
      raise exception 'The practice room is not available.';
    end if;

    select count(*)
    into conflicting_count
    from public.room_reservation_requests
    where room_id = current_request.room_id
      and id <> current_request.id
      and reservation_date = current_request.reservation_date
      and status = 'approved'
      and start_time < current_request.end_time
      and end_time > current_request.start_time;

    if conflicting_count > 0 then
      raise exception 'The practice room is already reserved for this time.';
    end if;
  end if;

  update public.room_reservation_requests
  set
    status = new_status,
    admin_note = case when new_status = 'rejected' then cleaned_note else null end,
    reviewed_by = (select auth.uid()),
    reviewed_at = now()
  where id = target_request_id
  returning * into updated_request;

  return updated_request;
end;
$$;

revoke all on function public.transition_room_reservation_request(
  uuid,
  public.room_reservation_status,
  text
) from public;

grant execute on function public.transition_room_reservation_request(
  uuid,
  public.room_reservation_status,
  text
) to authenticated;
