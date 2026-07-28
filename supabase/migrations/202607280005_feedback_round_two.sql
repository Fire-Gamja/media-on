alter table public.notices
  add column if not exists is_urgent boolean not null default false,
  add column if not exists urgent_resend_count integer not null default 0,
  add column if not exists last_urgent_resent_at timestamptz;

update public.notices
set is_urgent = true
where title ~ '^\[긴급\]';

create index if not exists notices_urgent_published_idx
on public.notices (published_at desc)
where is_published = true and is_urgent = true;

create or replace function public.transition_assistant_inquiry(
  target_inquiry_id uuid,
  new_status public.assistant_inquiry_status,
  reply text default null
)
returns public.assistant_inquiries
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_inquiry public.assistant_inquiries;
  updated_inquiry public.assistant_inquiries;
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'Authentication is required.'
      using errcode = '42501';
  end if;

  select *
  into current_inquiry
  from public.assistant_inquiries
  where id = target_inquiry_id
  for update;

  if current_inquiry.id is null then
    raise exception 'The assistant inquiry does not exist.';
  end if;

  if current_inquiry.status = 'submitted'
    and new_status = 'in_progress'
  then
    if not public.is_admin() then
      raise exception 'Administrator permission is required.'
        using errcode = '42501';
    end if;
  elsif current_inquiry.status = 'in_progress'
    and new_status = 'answered'
  then
    if current_inquiry.requester_id <> current_user_id
      and not public.is_admin()
    then
      raise exception 'Only inquiry participants can close the consultation.'
        using errcode = '42501';
    end if;
  else
    raise exception 'The requested assistant inquiry status transition is not allowed.';
  end if;

  update public.assistant_inquiries
  set
    status = new_status,
    answer = null,
    answered_by = case
      when new_status = 'answered' then current_user_id
      else null
    end,
    answered_at = case
      when new_status = 'answered' then now()
      else null
    end
  where id = target_inquiry_id
  returning * into updated_inquiry;

  return updated_inquiry;
end;
$$;

revoke all on function public.transition_assistant_inquiry(
  uuid,
  public.assistant_inquiry_status,
  text
) from public;

grant execute on function public.transition_assistant_inquiry(
  uuid,
  public.assistant_inquiry_status,
  text
) to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'assistant_inquiries'
  ) then
    alter publication supabase_realtime
      add table public.assistant_inquiries;
  end if;
end;
$$;

-- The user requested a clean inquiry test cycle. Chat messages are removed by
-- the assistant_messages foreign key with ON DELETE CASCADE.
delete from public.app_notifications
where route like '/assistant-inquiries/%'
   or route like '/admin-assistant-inquiry%';

delete from public.assistant_inquiries;
