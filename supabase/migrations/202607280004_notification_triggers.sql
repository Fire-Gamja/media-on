create or replace function public.notify_request_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user uuid;
  item_title text;
  item_route text;
begin
  if old.status is not distinct from new.status then return new; end if;
  target_user := new.requester_id;
  if tg_table_name = 'equipment_rental_requests' then
    item_title := '기자재 대여 진행 상태가 변경되었습니다.';
    item_route := '/equipment-requests/' || new.id;
  elsif tg_table_name = 'room_reservation_requests' then
    item_title := '실습실 대여 진행 상태가 변경되었습니다.';
    item_route := '/room-requests/' || new.id;
  elsif tg_table_name = 'facility_reports' then
    target_user := new.reporter_id;
    item_title := '시설 신고 진행 상태가 변경되었습니다.';
    item_route := '/facility-reports/' || new.id;
  else
    item_title := '조교 문의 상태가 변경되었습니다.';
    item_route := '/assistant-inquiries/' || new.id;
  end if;
  insert into public.app_notifications (user_id, title, body, route)
  values (target_user, '진행 상태 알림', item_title, item_route);
  return new;
end;
$$;

create trigger equipment_status_notification after update of status on public.equipment_rental_requests
for each row execute function public.notify_request_status_change();
create trigger room_status_notification after update of status on public.room_reservation_requests
for each row execute function public.notify_request_status_change();
create trigger facility_status_notification after update of status on public.facility_reports
for each row execute function public.notify_request_status_change();
create trigger assistant_status_notification after update of status on public.assistant_inquiries
for each row execute function public.notify_request_status_change();

create or replace function public.notify_chat_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  inquiry public.assistant_inquiries;
begin
  select * into inquiry from public.assistant_inquiries where id = new.inquiry_id;
  if new.sender_id = inquiry.requester_id then
    insert into public.app_notifications (user_id, title, body, route)
    select id, '새 조교 문의 메시지', left(new.content, 120), '/admin-assistant-inquiry?id=' || new.inquiry_id
    from public.profiles where role = 'admin' and approval_status = 'approved';
  else
    insert into public.app_notifications (user_id, title, body, route)
    values (inquiry.requester_id, '조교의 새 메시지', left(new.content, 120), '/assistant-inquiries/' || new.inquiry_id);
  end if;
  return new;
end;
$$;

create trigger assistant_message_notification
after insert on public.assistant_messages
for each row execute function public.notify_chat_message();
