alter table public.facility_reports
  alter column status drop default;

alter type public.facility_report_status
  rename to facility_report_status_old;

create type public.facility_report_status as enum (
  'submitted',
  'received',
  'in_progress',
  'resolved',
  'rejected'
);

alter table public.facility_reports
  alter column status type public.facility_report_status
  using status::text::public.facility_report_status;

update public.facility_reports
set status = 'submitted'
where status = 'received';

alter table public.facility_reports
  alter column status set default 'submitted';

drop type public.facility_report_status_old;

revoke update on table public.facility_reports from authenticated;

create or replace function public.transition_facility_report(
  target_report_id uuid,
  new_status public.facility_report_status,
  note text default null
)
returns public.facility_reports
language plpgsql
security definer set search_path = ''
as $$
declare
  current_report public.facility_reports;
  updated_report public.facility_reports;
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
  into current_report
  from public.facility_reports
  where id = target_report_id
  for update;

  if current_report.id is null then
    raise exception 'The facility report does not exist.';
  end if;

  if not (
    (current_report.status = 'submitted' and new_status in ('received', 'rejected'))
    or (current_report.status = 'received' and new_status = 'in_progress')
    or (current_report.status = 'in_progress' and new_status = 'resolved')
  ) then
    raise exception 'The requested facility report status transition is not allowed.';
  end if;

  if new_status in ('rejected', 'resolved') and cleaned_note is null then
    raise exception 'An administrator note is required for this status.';
  end if;

  update public.facility_reports
  set
    status = new_status,
    admin_note = case
      when new_status in ('rejected', 'resolved') then cleaned_note
      else null
    end,
    reviewed_by = (select auth.uid()),
    resolved_at = case when new_status = 'resolved' then now() else null end
  where id = target_report_id
  returning * into updated_report;

  return updated_report;
end;
$$;

revoke all on function public.transition_facility_report(
  uuid,
  public.facility_report_status,
  text
) from public;

grant execute on function public.transition_facility_report(
  uuid,
  public.facility_report_status,
  text
) to authenticated;
