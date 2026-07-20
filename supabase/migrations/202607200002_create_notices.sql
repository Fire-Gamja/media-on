create table public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  content text not null check (char_length(content) between 1 and 20000),
  is_published boolean not null default true,
  published_at timestamptz,
  created_by uuid not null default auth.uid()
    references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notices_published_at_idx
on public.notices (published_at desc)
where is_published = true;

alter table public.notices enable row level security;

revoke all on table public.notices from anon, authenticated;
grant select, insert, update, delete on table public.notices to authenticated;
grant all on table public.notices to service_role;

create or replace function public.is_approved_user()
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and approval_status = 'approved'
  );
$$;

revoke all on function public.is_approved_user() from public;
grant execute on function public.is_approved_user() to authenticated;

create policy "Approved users can read published notices"
on public.notices
for select
to authenticated
using (
  (is_published and (select public.is_approved_user()))
  or (select public.is_admin())
);

create policy "Admins can create notices"
on public.notices
for insert
to authenticated
with check ((select public.is_admin()));

create policy "Admins can update notices"
on public.notices
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Admins can delete notices"
on public.notices
for delete
to authenticated
using ((select public.is_admin()));

create trigger notices_set_updated_at
  before update on public.notices
  for each row execute procedure public.set_updated_at();

insert into public.notices (title, content, created_by, published_at)
select seed.title, seed.content, administrator.id, now()
from (
  values
    (
      '2026년 대한민국 인재상 홍보(한국장학재단)',
      '2026년 대한민국 인재상 선발 관련 안내입니다. 자세한 신청 일정과 제출 서류는 학부 사무실에 문의해 주세요.'
    ),
    (
      '2026학년도 2학기 세명대학교 학점교류 수학 안내',
      '2026학년도 2학기 세명대학교 학점교류 신청을 안내합니다. 신청을 희망하는 학생은 기간 내 관련 서류를 제출해 주세요.'
    ),
    (
      '2026학년도 2학기 한국교원대학교 수학 안내',
      '2026학년도 2학기 한국교원대학교 학점교류 수학 안내입니다. 세부 내용은 첨부 공문과 학부 안내를 확인해 주세요.'
    )
) as seed(title, content)
cross join lateral (
  select id
  from public.profiles
  where role = 'admin' and approval_status = 'approved'
  order by created_at
  limit 1
) as administrator;
