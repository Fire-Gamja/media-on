create type public.push_platform as enum ('android', 'ios');

create table public.push_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  expo_push_token text not null unique
    check (
      expo_push_token ~
      '^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]+\]$'
    ),
  platform public.push_platform not null,
  is_active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint push_devices_user_id_fkey
    foreign key (user_id) references public.profiles (id) on delete cascade
);

create index push_devices_active_user_idx
on public.push_devices (user_id)
where is_active = true;

alter table public.push_devices enable row level security;

revoke all on table public.push_devices from anon, authenticated;
grant all on table public.push_devices to service_role;

create trigger push_devices_set_updated_at
  before update on public.push_devices
  for each row execute procedure public.set_updated_at();

create or replace function public.register_push_device(
  push_token text,
  device_platform text
)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  parsed_platform public.push_platform;
begin
  if current_user_id is null then
    raise exception 'Authentication is required.'
      using errcode = '42501';
  end if;

  if not public.is_approved_user() then
    raise exception 'An approved account is required.'
      using errcode = '42501';
  end if;

  if push_token !~
    '^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]+\]$'
  then
    raise exception 'The Expo push token is invalid.';
  end if;

  if device_platform not in ('android', 'ios') then
    raise exception 'The device platform is invalid.';
  end if;

  parsed_platform := device_platform::public.push_platform;

  insert into public.push_devices (
    user_id,
    expo_push_token,
    platform,
    is_active,
    last_seen_at
  )
  values (
    current_user_id,
    push_token,
    parsed_platform,
    true,
    now()
  )
  on conflict (expo_push_token)
  do update set
    user_id = excluded.user_id,
    platform = excluded.platform,
    is_active = true,
    last_seen_at = now();
end;
$$;

revoke all on function public.register_push_device(text, text) from public;
grant execute on function public.register_push_device(text, text)
to authenticated;

create or replace function public.disable_push_device(push_token text)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.push_devices
  set is_active = false
  where user_id = (select auth.uid())
    and expo_push_token = push_token;
end;
$$;

revoke all on function public.disable_push_device(text) from public;
grant execute on function public.disable_push_device(text) to authenticated;
