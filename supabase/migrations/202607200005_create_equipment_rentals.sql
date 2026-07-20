create type public.equipment_request_status as enum (
  'submitted',
  'approved',
  'checked_out',
  'returned',
  'rejected'
);

create table public.equipment_items (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 100),
  category text not null check (char_length(category) between 1 and 50),
  total_quantity integer not null check (total_quantity > 0),
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.equipment_rental_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null default auth.uid(),
  equipment_id uuid not null,
  quantity integer not null check (quantity > 0),
  pickup_date date not null,
  return_date date not null,
  purpose text not null check (char_length(purpose) between 1 and 1000),
  status public.equipment_request_status not null default 'submitted',
  admin_note text check (admin_note is null or char_length(admin_note) <= 2000),
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint equipment_rental_requests_date_check
    check (return_date >= pickup_date),
  constraint equipment_rental_requests_requester_id_fkey
    foreign key (requester_id) references public.profiles (id) on delete cascade,
  constraint equipment_rental_requests_equipment_id_fkey
    foreign key (equipment_id) references public.equipment_items (id) on delete restrict,
  constraint equipment_rental_requests_reviewed_by_fkey
    foreign key (reviewed_by) references public.profiles (id) on delete set null
);

create index equipment_rental_requests_requester_created_at_idx
on public.equipment_rental_requests (requester_id, created_at desc);

create index equipment_rental_requests_status_created_at_idx
on public.equipment_rental_requests (status, created_at desc);

create index equipment_rental_requests_schedule_idx
on public.equipment_rental_requests (equipment_id, pickup_date, return_date);

alter table public.equipment_items enable row level security;
alter table public.equipment_rental_requests enable row level security;

revoke all on table public.equipment_items from anon, authenticated;
grant select, insert, update, delete on table public.equipment_items to authenticated;
grant all on table public.equipment_items to service_role;

revoke all on table public.equipment_rental_requests from anon, authenticated;
grant select, insert on table public.equipment_rental_requests to authenticated;
grant all on table public.equipment_rental_requests to service_role;

create policy "Approved users can read active equipment"
on public.equipment_items
for select
to authenticated
using (
  (is_active and (select public.is_approved_user()))
  or (select public.is_admin())
);

create policy "Admins can create equipment"
on public.equipment_items
for insert
to authenticated
with check ((select public.is_admin()));

create policy "Admins can update equipment"
on public.equipment_items
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Admins can delete equipment"
on public.equipment_items
for delete
to authenticated
using ((select public.is_admin()));

create policy "Approved users can create their own rental requests"
on public.equipment_rental_requests
for insert
to authenticated
with check (
  requester_id = (select auth.uid())
  and (select public.is_approved_user())
  and status = 'submitted'
  and quantity <= (
    select total_quantity
    from public.equipment_items
    where id = equipment_id and is_active
  )
);

create policy "Users can read their own rental requests"
on public.equipment_rental_requests
for select
to authenticated
using (
  requester_id = (select auth.uid())
  or (select public.is_admin())
);

create trigger equipment_items_set_updated_at
  before update on public.equipment_items
  for each row execute procedure public.set_updated_at();

create trigger equipment_rental_requests_set_updated_at
  before update on public.equipment_rental_requests
  for each row execute procedure public.set_updated_at();

create or replace function public.transition_equipment_rental_request(
  target_request_id uuid,
  new_status public.equipment_request_status,
  note text default null
)
returns public.equipment_rental_requests
language plpgsql
security definer set search_path = ''
as $$
declare
  current_request public.equipment_rental_requests;
  updated_request public.equipment_rental_requests;
  equipment_quantity integer;
  reserved_quantity integer;
  cleaned_note text := nullif(btrim(coalesce(note, '')), '');
begin
  if not public.is_admin() then
    raise exception 'Administrator permission is required.'
      using errcode = '42501';
  end if;

  if char_length(coalesce(note, '')) > 2000 then
    raise exception 'The administrator note must be 2000 characters or fewer.';
  end if;

  select *
  into current_request
  from public.equipment_rental_requests
  where id = target_request_id
  for update;

  if current_request.id is null then
    raise exception 'The rental request does not exist.';
  end if;

  if not (
    (current_request.status = 'submitted' and new_status in ('approved', 'rejected'))
    or (current_request.status = 'approved' and new_status = 'checked_out')
    or (current_request.status = 'checked_out' and new_status = 'returned')
  ) then
    raise exception 'The requested rental status transition is not allowed.';
  end if;

  if new_status = 'rejected' and cleaned_note is null then
    raise exception 'A rejection reason is required.';
  end if;

  if new_status = 'approved' then
    select total_quantity
    into equipment_quantity
    from public.equipment_items
    where id = current_request.equipment_id and is_active
    for update;

    if equipment_quantity is null then
      raise exception 'The equipment is not available.';
    end if;

    select coalesce(sum(quantity), 0)
    into reserved_quantity
    from public.equipment_rental_requests
    where equipment_id = current_request.equipment_id
      and id <> current_request.id
      and status in ('approved', 'checked_out')
      and pickup_date <= current_request.return_date
      and return_date >= current_request.pickup_date;

    if reserved_quantity + current_request.quantity > equipment_quantity then
      raise exception 'There is not enough equipment available for these dates.';
    end if;
  end if;

  update public.equipment_rental_requests
  set
    status = new_status,
    admin_note = case when new_status = 'rejected' then cleaned_note else null end,
    reviewed_by = (select auth.uid()),
    reviewed_at = now()
  where id = target_request_id
  returning * into updated_request;

  return updated_request;
end;
$$;

revoke all on function public.transition_equipment_rental_request(
  uuid,
  public.equipment_request_status,
  text
) from public;

grant execute on function public.transition_equipment_rental_request(
  uuid,
  public.equipment_request_status,
  text
) to authenticated;

insert into public.equipment_items (
  name,
  category,
  total_quantity,
  description
)
values
  ('DSLR 카메라', '촬영 장비', 4, '수업 및 학부 활동 촬영용 카메라'),
  ('SD 카드', '저장 장치', 10, '카메라 촬영용 메모리 카드'),
  ('노트북', '컴퓨터', 5, '수업 및 실습용 노트북'),
  ('갤럭시 탭', '태블릿', 6, '수업 및 콘텐츠 확인용 태블릿'),
  ('빔프로젝터', '영상 장비', 2, '행사 및 발표용 프로젝터'),
  ('짐벌', '촬영 장비', 3, '영상 촬영용 안정화 장비'),
  ('캡처보드', '영상 장비', 3, '외부 영상 입력 및 송출 장비'),
  ('펜 태블릿', '입력 장치', 4, '그래픽 실습용 펜 태블릿')
on conflict (name) do nothing;
