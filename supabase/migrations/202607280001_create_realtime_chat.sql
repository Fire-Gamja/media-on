alter table public.assistant_inquiries
  add column if not exists client_request_id uuid;

create unique index if not exists assistant_inquiries_requester_client_key
on public.assistant_inquiries (requester_id, client_request_id)
where client_request_id is not null;

create or replace function public.create_assistant_inquiry_once(
  request_key uuid,
  inquiry_category public.assistant_inquiry_category,
  inquiry_title text,
  inquiry_content text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  inquiry_id uuid;
begin
  insert into public.assistant_inquiries (
    requester_id, category, title, content, client_request_id
  )
  values (
    auth.uid(), inquiry_category, inquiry_title, inquiry_content, request_key
  )
  on conflict (requester_id, client_request_id)
    where client_request_id is not null
  do nothing
  returning id into inquiry_id;

  if inquiry_id is null then
    select id into inquiry_id
    from public.assistant_inquiries
    where requester_id = auth.uid()
      and client_request_id = request_key;
  end if;
  return inquiry_id;
end;
$$;

grant execute on function public.create_assistant_inquiry_once(
  uuid, public.assistant_inquiry_category, text, text
) to authenticated;

create table if not exists public.assistant_messages (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.assistant_inquiries (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(trim(content)) between 1 and 5000),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists assistant_messages_inquiry_created_idx
on public.assistant_messages (inquiry_id, created_at);

alter table public.assistant_messages enable row level security;
grant select, insert on table public.assistant_messages to authenticated;
grant all on table public.assistant_messages to service_role;

create policy "Inquiry participants can read messages"
on public.assistant_messages for select to authenticated
using (
  exists (
    select 1 from public.assistant_inquiries inquiry
    where inquiry.id = inquiry_id
      and (
        inquiry.requester_id = auth.uid()
        or public.is_admin()
      )
  )
);

create policy "Inquiry participants can send messages"
on public.assistant_messages for insert to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.assistant_inquiries inquiry
    where inquiry.id = inquiry_id
      and inquiry.status <> 'answered'
      and (
        inquiry.requester_id = auth.uid()
        or public.is_admin()
      )
  )
);

insert into public.assistant_messages (inquiry_id, sender_id, content, created_at)
select id, requester_id, content, created_at
from public.assistant_inquiries inquiry
where not exists (
  select 1 from public.assistant_messages message
  where message.inquiry_id = inquiry.id
);

insert into public.assistant_messages (inquiry_id, sender_id, content, created_at)
select id, answered_by, answer, coalesce(answered_at, updated_at)
from public.assistant_inquiries inquiry
where answer is not null
  and answered_by is not null
  and not exists (
    select 1 from public.assistant_messages message
    where message.inquiry_id = inquiry.id
      and message.sender_id = inquiry.answered_by
  );

alter publication supabase_realtime add table public.assistant_messages;
