alter table public.home_popups
  add column if not exists image_url text;

insert into storage.buckets (id, name, public)
values ('home-popup-images', 'home-popup-images', true)
on conflict (id) do update set public = true;

create policy "Admins upload home popup images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'home-popup-images'
  and (select public.is_admin())
);

create policy "Admins update home popup images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'home-popup-images'
  and (select public.is_admin())
)
with check (
  bucket_id = 'home-popup-images'
  and (select public.is_admin())
);

create policy "Home popup images are public"
on storage.objects
for select
to public
using (bucket_id = 'home-popup-images');
