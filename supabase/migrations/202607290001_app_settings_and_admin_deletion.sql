alter table public.profiles
  add column if not exists general_notifications_enabled boolean not null default true,
  add column if not exists color_mode text not null default 'light'
    check (color_mode in ('light', 'dark'));

create or replace function public.update_my_app_settings(
  next_general_notifications_enabled boolean,
  next_color_mode text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication is required.'
      using errcode = '42501';
  end if;

  if next_color_mode not in ('light', 'dark') then
    raise exception 'The requested color mode is invalid.';
  end if;

  update public.profiles
  set
    general_notifications_enabled =
      next_general_notifications_enabled,
    color_mode = next_color_mode
  where id = (select auth.uid());
end;
$$;

revoke all on function public.update_my_app_settings(boolean, text)
from public;
grant execute on function public.update_my_app_settings(boolean, text)
to authenticated;

grant delete on table public.app_notifications to authenticated;

create policy "Users can delete their notifications"
on public.app_notifications
for delete
to authenticated
using (user_id = (select auth.uid()));

create or replace function public.admin_delete_equipment_request(
  target_request_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator permission is required.'
      using errcode = '42501';
  end if;

  delete from public.app_notifications
  where route in (
    '/equipment-requests/' || target_request_id,
    '/admin-equipment-request?id=' || target_request_id
  );

  delete from public.equipment_rental_requests
  where id = target_request_id;
  if not found then
    raise exception 'The rental request does not exist.';
  end if;
end;
$$;

create or replace function public.admin_delete_room_request(
  target_request_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator permission is required.'
      using errcode = '42501';
  end if;

  delete from public.app_notifications
  where route in (
    '/room-requests/' || target_request_id,
    '/admin-room-request?id=' || target_request_id
  );

  delete from public.room_reservation_requests
  where id = target_request_id;
  if not found then
    raise exception 'The room request does not exist.';
  end if;
end;
$$;

create or replace function public.admin_delete_assistant_inquiry(
  target_inquiry_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator permission is required.'
      using errcode = '42501';
  end if;

  delete from public.app_notifications
  where route in (
    '/assistant-inquiries/' || target_inquiry_id,
    '/admin-assistant-inquiry?id=' || target_inquiry_id
  );

  delete from public.assistant_inquiries
  where id = target_inquiry_id;
  if not found then
    raise exception 'The inquiry does not exist.';
  end if;
end;
$$;

revoke all on function public.admin_delete_equipment_request(uuid) from public;
revoke all on function public.admin_delete_room_request(uuid) from public;
revoke all on function public.admin_delete_assistant_inquiry(uuid) from public;
grant execute on function public.admin_delete_equipment_request(uuid) to authenticated;
grant execute on function public.admin_delete_room_request(uuid) to authenticated;
grant execute on function public.admin_delete_assistant_inquiry(uuid) to authenticated;
