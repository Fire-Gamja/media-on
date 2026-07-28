create table if not exists public.feature_search_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references public.profiles (id) on delete cascade,
  query text not null check (
    length(trim(query)) between 1 and 500
  ),
  selected_feature_id text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists feature_search_logs_created_idx
on public.feature_search_logs (created_at desc);

create index if not exists feature_search_logs_query_idx
on public.feature_search_logs (query);

alter table public.feature_search_logs enable row level security;

grant insert, select on table public.feature_search_logs to authenticated;
grant all on table public.feature_search_logs to service_role;

create policy "Users can save their feature searches"
on public.feature_search_logs for insert to authenticated
with check (user_id = auth.uid());

create policy "Users can read their feature searches"
on public.feature_search_logs for select to authenticated
using (user_id = auth.uid() or public.is_admin());

create table if not exists public.operating_hours_settings (
  id smallint primary key default 1 check (id = 1),
  mode text not null default 'vacation'
    check (mode in ('vacation', 'semester')),
  start_time time not null default '09:00',
  end_time time not null default '17:00',
  closed_note text not null default '주말 및 공휴일 휴무',
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default timezone('utc', now()),
  check (start_time < end_time)
);

insert into public.operating_hours_settings (
  id,
  mode,
  start_time,
  end_time,
  closed_note
)
values (
  1,
  'vacation',
  '09:00',
  '17:00',
  '주말 및 공휴일 휴무'
)
on conflict (id) do nothing;

alter table public.operating_hours_settings enable row level security;

grant select on table public.operating_hours_settings to authenticated;
grant all on table public.operating_hours_settings to service_role;

create policy "Authenticated users can read operating hours"
on public.operating_hours_settings for select to authenticated
using (true);

create or replace function public.update_operating_hours_settings(
  next_mode text,
  next_start_time time,
  next_end_time time
)
returns public.operating_hours_settings
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  updated_settings public.operating_hours_settings;
begin
  if current_user_id is null or not public.is_admin() then
    raise exception 'Administrator permission is required.'
      using errcode = '42501';
  end if;

  if next_mode not in ('vacation', 'semester') then
    raise exception 'The operating mode is invalid.';
  end if;

  if next_start_time >= next_end_time then
    raise exception 'The end time must be later than the start time.';
  end if;

  insert into public.operating_hours_settings (
    id,
    mode,
    start_time,
    end_time,
    closed_note,
    updated_by,
    updated_at
  )
  values (
    1,
    next_mode,
    next_start_time,
    next_end_time,
    '주말 및 공휴일 휴무',
    current_user_id,
    now()
  )
  on conflict (id) do update
  set
    mode = excluded.mode,
    start_time = excluded.start_time,
    end_time = excluded.end_time,
    closed_note = excluded.closed_note,
    updated_by = excluded.updated_by,
    updated_at = excluded.updated_at
  returning * into updated_settings;

  return updated_settings;
end;
$$;

revoke all on function public.update_operating_hours_settings(
  text,
  time,
  time
) from public;

grant execute on function public.update_operating_hours_settings(
  text,
  time,
  time
) to authenticated;
