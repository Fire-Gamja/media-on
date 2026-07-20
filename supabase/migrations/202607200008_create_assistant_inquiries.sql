create type public.assistant_inquiry_category as enum (
  'academic',
  'equipment',
  'room',
  'facility',
  'other'
);

create type public.assistant_inquiry_status as enum (
  'submitted',
  'in_progress',
  'answered'
);

create table public.assistant_inquiries (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null default auth.uid(),
  category public.assistant_inquiry_category not null,
  title text not null check (char_length(title) between 1 and 200),
  content text not null check (char_length(content) between 1 and 5000),
  status public.assistant_inquiry_status not null default 'submitted',
  answer text check (answer is null or char_length(answer) between 1 and 5000),
  answered_by uuid,
  answered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assistant_inquiries_requester_id_fkey
    foreign key (requester_id) references public.profiles (id) on delete cascade,
  constraint assistant_inquiries_answered_by_fkey
    foreign key (answered_by) references public.profiles (id) on delete set null
);

create index assistant_inquiries_requester_created_at_idx
on public.assistant_inquiries (requester_id, created_at desc);

create index assistant_inquiries_status_created_at_idx
on public.assistant_inquiries (status, created_at asc);

alter table public.assistant_inquiries enable row level security;

revoke all on table public.assistant_inquiries from anon, authenticated;
grant select, insert on table public.assistant_inquiries to authenticated;
grant all on table public.assistant_inquiries to service_role;

create policy "Approved users can create their own assistant inquiries"
on public.assistant_inquiries
for insert
to authenticated
with check (
  requester_id = (select auth.uid())
  and (select public.is_approved_user())
  and status = 'submitted'
);

create policy "Users can read their own assistant inquiries"
on public.assistant_inquiries
for select
to authenticated
using (
  requester_id = (select auth.uid())
  or (select public.is_admin())
);

create trigger assistant_inquiries_set_updated_at
  before update on public.assistant_inquiries
  for each row execute procedure public.set_updated_at();

create or replace function public.transition_assistant_inquiry(
  target_inquiry_id uuid,
  new_status public.assistant_inquiry_status,
  reply text default null
)
returns public.assistant_inquiries
language plpgsql
security definer set search_path = ''
as $$
declare
  current_inquiry public.assistant_inquiries;
  updated_inquiry public.assistant_inquiries;
  cleaned_reply text := nullif(btrim(coalesce(reply, '')), '');
begin
  if not public.is_admin() then
    raise exception 'Administrator permission is required.'
      using errcode = '42501';
  end if;

  if char_length(coalesce(reply, '')) > 5000 then
    raise exception 'The answer must be 5000 characters or fewer.';
  end if;

  select *
  into current_inquiry
  from public.assistant_inquiries
  where id = target_inquiry_id
  for update;

  if current_inquiry.id is null then
    raise exception 'The assistant inquiry does not exist.';
  end if;

  if not (
    (current_inquiry.status = 'submitted' and new_status = 'in_progress')
    or (current_inquiry.status = 'in_progress' and new_status = 'answered')
  ) then
    raise exception 'The requested assistant inquiry status transition is not allowed.';
  end if;

  if new_status = 'answered' and cleaned_reply is null then
    raise exception 'An answer is required.';
  end if;

  update public.assistant_inquiries
  set
    status = new_status,
    answer = case when new_status = 'answered' then cleaned_reply else null end,
    answered_by = case when new_status = 'answered' then (select auth.uid()) else null end,
    answered_at = case when new_status = 'answered' then now() else null end
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
