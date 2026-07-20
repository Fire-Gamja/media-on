create type public.facility_issue_category as enum (
  'network',
  'computer',
  'projector',
  'furniture',
  'electricity',
  'other'
);

create type public.facility_report_status as enum (
  'received',
  'in_progress',
  'resolved',
  'rejected'
);

create table public.facility_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid(),
  location text not null check (char_length(location) between 1 and 100),
  category public.facility_issue_category not null,
  title text not null check (char_length(title) between 1 and 200),
  description text not null check (char_length(description) between 1 and 5000),
  status public.facility_report_status not null default 'received',
  admin_note text check (admin_note is null or char_length(admin_note) <= 2000),
  reviewed_by uuid,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint facility_reports_reporter_id_fkey
    foreign key (reporter_id) references public.profiles (id) on delete cascade,
  constraint facility_reports_reviewed_by_fkey
    foreign key (reviewed_by) references public.profiles (id) on delete set null
);

create index facility_reports_reporter_created_at_idx
on public.facility_reports (reporter_id, created_at desc);

create index facility_reports_status_created_at_idx
on public.facility_reports (status, created_at desc);

alter table public.facility_reports enable row level security;

revoke all on table public.facility_reports from anon, authenticated;
grant select, insert, update on table public.facility_reports to authenticated;
grant all on table public.facility_reports to service_role;

create policy "Approved users can create their own facility reports"
on public.facility_reports
for insert
to authenticated
with check (
  reporter_id = (select auth.uid())
  and (select public.is_approved_user())
);

create policy "Users can read their own facility reports"
on public.facility_reports
for select
to authenticated
using (
  reporter_id = (select auth.uid())
  or (select public.is_admin())
);

create policy "Admins can update facility reports"
on public.facility_reports
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create trigger facility_reports_set_updated_at
  before update on public.facility_reports
  for each row execute procedure public.set_updated_at();
