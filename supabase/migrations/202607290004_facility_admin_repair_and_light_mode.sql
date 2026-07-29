-- Dark mode was removed from the student experience. Keep existing profiles
-- on the single supported theme so previously saved settings cannot re-enable it.
update public.profiles
set color_mode = 'light'
where color_mode <> 'light';

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

  update public.profiles
  set
    general_notifications_enabled =
      next_general_notifications_enabled,
    color_mode = 'light'
  where id = (select auth.uid());
end;
$$;

revoke all on function public.update_my_app_settings(boolean, text)
from public;
grant execute on function public.update_my_app_settings(boolean, text)
to authenticated;

-- Use text parameters and a void return value so PostgREST does not need to
-- resolve the custom enum or composite return type when an admin changes status.
create or replace function public.admin_transition_facility_report(
  target_report_id uuid,
  target_status text,
  admin_note_input text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_status text;
  cleaned_note text :=
    nullif(pg_catalog.btrim(coalesce(admin_note_input, '')), '');
begin
  if not public.is_admin() then
    raise exception 'Administrator permission is required.'
      using errcode = '42501';
  end if;

  if target_status not in (
    'received',
    'in_progress',
    'resolved',
    'rejected'
  ) then
    raise exception 'The requested facility status is invalid.'
      using errcode = '22023';
  end if;

  if pg_catalog.char_length(coalesce(admin_note_input, '')) > 2000 then
    raise exception 'The administrator note must be 2000 characters or fewer.'
      using errcode = '22001';
  end if;

  select status::text
  into current_status
  from public.facility_reports
  where id = target_report_id
  for update;

  if current_status is null then
    raise exception 'The facility report does not exist.'
      using errcode = 'P0002';
  end if;

  if not (
    (current_status = 'submitted' and target_status in ('received', 'rejected'))
    or (current_status = 'received' and target_status = 'in_progress')
    or (current_status = 'in_progress' and target_status = 'resolved')
  ) then
    raise exception 'The requested facility report status transition is not allowed.'
      using errcode = '22023';
  end if;

  if target_status in ('rejected', 'resolved') and cleaned_note is null then
    raise exception 'An administrator note is required for this status.'
      using errcode = '22023';
  end if;

  update public.facility_reports
  set
    status = target_status::public.facility_report_status,
    admin_note = case
      when target_status in ('rejected', 'resolved') then cleaned_note
      else null
    end,
    reviewed_by = (select auth.uid()),
    resolved_at = case
      when target_status = 'resolved' then pg_catalog.now()
      else null
    end
  where id = target_report_id;
end;
$$;

revoke all on function public.admin_transition_facility_report(
  uuid,
  text,
  text
) from public;
grant execute on function public.admin_transition_facility_report(
  uuid,
  text,
  text
) to authenticated;

create or replace function public.admin_delete_facility_report(
  target_report_id uuid
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
    '/facility-reports/' || target_report_id,
    '/admin-facility-report?id=' || target_report_id
  );

  delete from public.facility_reports
  where id = target_report_id;

  if not found then
    raise exception 'The facility report does not exist.'
      using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.admin_delete_facility_report(uuid) from public;
grant execute on function public.admin_delete_facility_report(uuid)
to authenticated;
