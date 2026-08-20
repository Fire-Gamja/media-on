alter table public.notices
  add column if not exists is_pinned boolean not null default false,
  add column if not exists expires_at timestamptz;

create index if not exists notices_pinned_published_at_idx
on public.notices (is_pinned desc, is_urgent desc, published_at desc)
where is_published = true;

drop policy if exists "Approved users can read published notices"
on public.notices;

create policy "Approved users can read published notices"
on public.notices
for select
to authenticated
using (
  (
    is_published
    and (expires_at is null or expires_at > now())
    and (select public.is_approved_user())
  )
  or (select public.is_admin())
);

comment on column public.notices.is_pinned is
  'Pinned notices are shown before non-pinned notices in student clients.';

comment on column public.notices.expires_at is
  'Published notices become invisible to students after this timestamp.';
