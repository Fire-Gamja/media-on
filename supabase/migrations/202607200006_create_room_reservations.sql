create type public.room_reservation_status as enum (
  'submitted',
  'approved',
  'completed',
  'rejected'
);

create table public.practice_rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 100),
  location text not null check (char_length(location) between 1 and 100),
  capacity integer not null check (capacity > 0),
  open_time time not null default '09:00',
  close_time time not null default '17:00',
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint practice_rooms_hours_check check (close_time > open_time)
);

create table public.room_reservation_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null default auth.uid(),
  room_id uuid not null,
  reservation_date date not null,
  start_time time not null,
  end_time time not null,
  attendee_count integer not null check (attendee_count > 0),
  purpose text not null check (char_length(purpose) between 1 and 1000),
  status public.room_reservation_status not null default 'submitted',
  admin_note text check (admin_note is null or char_length(admin_note) <= 2000),
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint room_reservation_requests_time_check check (end_time > start_time),
  constraint room_reservation_requests_requester_id_fkey
    foreign key (requester_id) references public.profiles (id) on delete cascade,
  constraint room_reservation_requests_room_id_fkey
    foreign key (room_id) references public.practice_rooms (id) on delete restrict,
  constraint room_reservation_requests_reviewed_by_fkey
    foreign key (reviewed_by) references public.profiles (id) on delete set null
);

create index room_reservation_requests_requester_created_at_idx
on public.room_reservation_requests (requester_id, created_at desc);

create index room_reservation_requests_status_created_at_idx
on public.room_reservation_requests (status, created_at desc);

create index room_reservation_requests_schedule_idx
on public.room_reservation_requests (
  room_id,
  reservation_date,
  start_time,
  end_time
);

alter table public.practice_rooms enable row level security;
alter table public.room_reservation_requests enable row level security;

revoke all on table public.practice_rooms from anon, authenticated;
grant select, insert, update, delete on table public.practice_rooms to authenticated;
grant all on table public.practice_rooms to service_role;

revoke all on table public.room_reservation_requests from anon, authenticated;
grant select, insert on table public.room_reservation_requests to authenticated;
grant all on table public.room_reservation_requests to service_role;

create policy "Approved users can read active practice rooms"
on public.practice_rooms
for select
to authenticated
using (
  (is_active and (select public.is_approved_user()))
  or (select public.is_admin())
);

create policy "Admins can create practice rooms"
on public.practice_rooms
for insert
to authenticated
with check ((select public.is_admin()));

create policy "Admins can update practice rooms"
on public.practice_rooms
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Admins can delete practice rooms"
on public.practice_rooms
for delete
to authenticated
using ((select public.is_admin()));

create policy "Approved users can create their own room reservations"
on public.room_reservation_requests
for insert
to authenticated
with check (
  requester_id = (select auth.uid())
  and (select public.is_approved_user())
  and status = 'submitted'
  and reservation_date >= current_date
  and attendee_count <= (
    select capacity
    from public.practice_rooms
    where id = room_id and is_active
  )
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

create policy "Users can read their own room reservations"
on public.room_reservation_requests
for select
to authenticated
using (
  requester_id = (select auth.uid())
  or (select public.is_admin())
);

create trigger practice_rooms_set_updated_at
  before update on public.practice_rooms
  for each row execute procedure public.set_updated_at();

create trigger room_reservation_requests_set_updated_at
  before update on public.room_reservation_requests
  for each row execute procedure public.set_updated_at();

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
    (current_request.status = 'submitted' and new_status in ('approved', 'rejected'))
    or (current_request.status = 'approved' and new_status = 'completed')
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
      and status in ('approved', 'completed')
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

insert into public.practice_rooms (
  name,
  location,
  capacity,
  open_time,
  close_time,
  description
)
values
  (
    '301호 미디어 실습실',
    '미디어관 301호',
    30,
    '09:00',
    '17:00',
    '미디어 수업과 팀 실습을 위한 공용 실습실'
  ),
  (
    '501호 편집 실습실',
    '미디어관 501호',
    25,
    '09:00',
    '17:00',
    '영상 편집과 콘텐츠 제작을 위한 실습실'
  )
on conflict (name) do nothing;
