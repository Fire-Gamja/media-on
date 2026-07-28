create table public.home_popups (
  slot_number smallint primary key check (slot_number between 1 and 3),
  title text not null default '',
  body text not null default '',
  action_label text not null default '자세히 보기',
  action_url text,
  is_active boolean not null default false,
  updated_by uuid references public.profiles (id) on delete set null
    default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint home_popups_action_url_check
    check (
      action_url is null
      or action_url ~* '^https?://[^[:space:]]+$'
    ),
  constraint home_popups_active_content_check
    check (
      not is_active
      or (
        length(trim(title)) between 1 and 60
        and length(trim(body)) between 1 and 240
      )
    )
);

insert into public.home_popups (slot_number)
values (1), (2), (3);

alter table public.home_popups enable row level security;

revoke all on table public.home_popups from anon, authenticated;
grant select, update on table public.home_popups to authenticated;
grant all on table public.home_popups to service_role;

create policy "Approved users can view active home popups"
on public.home_popups
for select
to authenticated
using (
  is_active
  and (select public.is_approved_user())
);

create policy "Admins can view all home popups"
on public.home_popups
for select
to authenticated
using ((select public.is_admin()));

create policy "Admins can update home popups"
on public.home_popups
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create trigger home_popups_set_updated_at
  before update on public.home_popups
  for each row execute procedure public.set_updated_at();

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
begin
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

create trigger equipment_request_admin_notification
  after insert on public.equipment_rental_requests
  for each row execute function public.notify_admin_new_request();

create trigger room_request_admin_notification
  after insert on public.room_reservation_requests
  for each row execute function public.notify_admin_new_request();

create trigger facility_report_admin_notification
  after insert on public.facility_reports
  for each row execute function public.notify_admin_new_request();

create trigger assistant_inquiry_admin_notification
  after insert on public.assistant_inquiries
  for each row execute function public.notify_admin_new_request();
