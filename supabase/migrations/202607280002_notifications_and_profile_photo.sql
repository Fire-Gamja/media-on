alter table public.profiles add column if not exists avatar_url text;

create table if not exists public.app_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  route text,
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists app_notifications_user_created_idx
on public.app_notifications (user_id, created_at desc);

alter table public.app_notifications enable row level security;
grant select, update on table public.app_notifications to authenticated;
grant all on table public.app_notifications to service_role;

create policy "Users can read their notifications"
on public.app_notifications for select to authenticated
using (user_id = auth.uid());

create policy "Users can mark their notifications"
on public.app_notifications for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

alter publication supabase_realtime add table public.app_notifications;

insert into storage.buckets (id, name, public)
values ('profile-images', 'profile-images', true)
on conflict (id) do update set public = true;

create policy "Users upload their profile image"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users update their profile image"
on storage.objects for update to authenticated
using (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Profile images are public"
on storage.objects for select to public
using (bucket_id = 'profile-images');
