alter table public.room_reservation_requests
  add column if not exists end_date date;

update public.room_reservation_requests
set end_date = reservation_date
where end_date is null;

alter table public.room_reservation_requests
  alter column end_date set not null;

alter table public.room_reservation_requests
  add constraint room_reservation_requests_date_range_check
  check (end_date >= reservation_date);

drop index if exists room_reservation_requests_schedule_idx;
create index room_reservation_requests_schedule_idx
on public.room_reservation_requests (
  room_id, reservation_date, end_date, start_time, end_time
);
