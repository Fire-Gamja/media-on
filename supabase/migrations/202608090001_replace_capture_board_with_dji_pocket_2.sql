update public.equipment_items
set
  is_active = false,
  updated_at = now()
where name = '캡처보드';

insert into public.equipment_items (
  name,
  category,
  total_quantity,
  description,
  is_active
)
values (
  'DJI Pocket 2',
  '촬영 장비',
  1,
  '휴대용 짐벌 카메라',
  true
)
on conflict (name) do update
set
  category = excluded.category,
  description = excluded.description,
  is_active = true,
  updated_at = now();
