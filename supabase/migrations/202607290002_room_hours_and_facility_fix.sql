update public.practice_rooms
set
  open_time = '09:00',
  close_time = '23:50'
where location in (
  '제 1자연관 101호',
  '제 1자연관 301호',
  '제 1자연관 501호',
  '제 1자연관 303호',
  '제 1자연관 304호',
  '제 1자연관 504호'
);

create or replace function public.transition_facility_report_v2(
  target_report_id uuid,
  requested_status text,
  note text default null
)
returns public.facility_reports
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_report public.facility_reports;
  updated_report public.facility_reports;
  next_status public.facility_report_status;
  cleaned_note text := nullif(btrim(coalesce(note, '')), '');
begin
  if not public.is_admin() then
    raise exception 'Administrator permission is required.'
      using errcode = '42501';
  end if;

  if requested_status not in (
    'received',
    'in_progress',
    'resolved',
    'rejected'
  ) then
    raise exception 'The requested facility status is invalid.';
  end if;

  next_status := requested_status::public.facility_report_status;

  if char_length(coalesce(note, '')) > 2000 then
    raise exception 'The administrator note must be 2000 characters or fewer.';
  end if;

  select *
  into current_report
  from public.facility_reports
  where id = target_report_id
  for update;

  if current_report.id is null then
    raise exception 'The facility report does not exist.';
  end if;

  if not (
    (current_report.status = 'submitted' and next_status in ('received', 'rejected'))
    or (current_report.status = 'received' and next_status = 'in_progress')
    or (current_report.status = 'in_progress' and next_status = 'resolved')
  ) then
    raise exception 'The requested facility report status transition is not allowed.';
  end if;

  if next_status in ('rejected', 'resolved') and cleaned_note is null then
    raise exception 'An administrator note is required for this status.';
  end if;

  update public.facility_reports
  set
    status = next_status,
    admin_note = case
      when next_status in ('rejected', 'resolved') then cleaned_note
      else null
    end,
    reviewed_by = (select auth.uid()),
    resolved_at = case when next_status = 'resolved' then now() else null end
  where id = target_report_id
  returning * into updated_report;

  return updated_report;
end;
$$;

revoke all on function public.transition_facility_report_v2(uuid, text, text)
from public;
grant execute on function public.transition_facility_report_v2(uuid, text, text)
to authenticated;
