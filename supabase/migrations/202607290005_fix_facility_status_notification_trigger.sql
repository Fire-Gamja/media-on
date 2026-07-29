-- The shared status trigger previously read NEW.requester_id before checking
-- which table fired it. facility_reports uses reporter_id instead, so every
-- facility status update failed with PostgreSQL error 42703.
create or replace function public.notify_request_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_data jsonb := pg_catalog.to_jsonb(new);
  target_user uuid;
  item_title text;
  item_route text;
begin
  if old.status is not distinct from new.status then
    return new;
  end if;

  if tg_table_name = 'equipment_rental_requests' then
    target_user := nullif(row_data ->> 'requester_id', '')::uuid;
    item_title := '기자재 대여 진행 상태가 변경되었습니다.';
    item_route := '/equipment-requests/' || new.id;
  elsif tg_table_name = 'room_reservation_requests' then
    target_user := nullif(row_data ->> 'requester_id', '')::uuid;
    item_title := '실습실 대여 진행 상태가 변경되었습니다.';
    item_route := '/room-requests/' || new.id;
  elsif tg_table_name = 'facility_reports' then
    target_user := nullif(row_data ->> 'reporter_id', '')::uuid;
    item_title := '시설 신고 진행 상태가 변경되었습니다.';
    item_route := '/facility-reports/' || new.id;
  elsif tg_table_name = 'assistant_inquiries' then
    target_user := nullif(row_data ->> 'requester_id', '')::uuid;
    item_title := '조교 문의 상태가 변경되었습니다.';
    item_route := '/assistant-inquiries/' || new.id;
  else
    raise exception 'Unsupported status notification table: %', tg_table_name
      using errcode = '22023';
  end if;

  if target_user is null then
    raise exception 'Status notification recipient is missing for %.%',
      tg_table_name,
      new.id
      using errcode = '23502';
  end if;

  insert into public.app_notifications (user_id, title, body, route)
  values (target_user, '진행 상태 알림', item_title, item_route);

  return new;
end;
$$;

revoke all on function public.notify_request_status_change() from public;
