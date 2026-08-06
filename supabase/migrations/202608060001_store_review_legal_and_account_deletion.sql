create table public.legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references public.profiles (id) on delete cascade,
  document_key text not null check (
    document_key in ('terms', 'privacy', 'ai_overseas_transfer')
  ),
  document_version text not null check (
    document_version ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
  ),
  accepted_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, document_key, document_version)
);

create index legal_acceptances_user_document_idx
on public.legal_acceptances (user_id, document_key, accepted_at desc);

alter table public.legal_acceptances enable row level security;

revoke all on table public.legal_acceptances from anon, authenticated;
grant select on table public.legal_acceptances to authenticated;
grant all on table public.legal_acceptances to service_role;

create policy "Users can read their legal acceptances"
on public.legal_acceptances
for select
to authenticated
using (user_id = (select auth.uid()));

create or replace function public.accept_required_legal_documents()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'Authentication is required.'
      using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.profiles where id = current_user_id
  ) then
    raise exception 'A profile is required.'
      using errcode = '42501';
  end if;

  insert into public.legal_acceptances (
    user_id,
    document_key,
    document_version
  )
  values
    (current_user_id, 'terms', '2026-08-06'),
    (current_user_id, 'privacy', '2026-08-06')
  on conflict (user_id, document_key, document_version)
  do update set accepted_at = timezone('utc', now());

  update public.profiles
  set
    terms_agreed = true,
    privacy_agreed = true,
    updated_at = timezone('utc', now())
  where id = current_user_id;
end;
$$;

revoke all on function public.accept_required_legal_documents() from public;
grant execute on function public.accept_required_legal_documents()
to authenticated;

create or replace function public.accept_ai_transfer(
  expected_version text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'Authentication is required.'
      using errcode = '42501';
  end if;

  if expected_version <> '2026-08-06' then
    raise exception 'The AI transfer document version is invalid.';
  end if;

  insert into public.legal_acceptances (
    user_id,
    document_key,
    document_version
  )
  values (
    current_user_id,
    'ai_overseas_transfer',
    expected_version
  )
  on conflict (user_id, document_key, document_version)
  do update set accepted_at = timezone('utc', now());
end;
$$;

revoke all on function public.accept_ai_transfer(text) from public;
grant execute on function public.accept_ai_transfer(text) to authenticated;

create policy "Users can delete their profile image"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_role public.user_role;
begin
  if current_user_id is null then
    raise exception 'Authentication is required.'
      using errcode = '42501';
  end if;

  select role
  into current_role
  from public.profiles
  where id = current_user_id;

  if current_role is null then
    raise exception 'The account does not exist.';
  end if;

  if current_role = 'admin' then
    raise exception 'Administrator accounts must be removed by the service operator.'
      using errcode = '42501';
  end if;

  delete from auth.users where id = current_user_id;

  if not found then
    raise exception 'The account could not be deleted.';
  end if;
end;
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;
