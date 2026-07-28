import { supabase } from '../lib/supabase';

export type HomePopup = {
  slot_number: 1 | 2 | 3;
  title: string;
  body: string;
  action_label: string;
  action_url: string | null;
  is_active: boolean;
  updated_at: string;
};

export type HomePopupInput = Pick<
  HomePopup,
  'slot_number' | 'title' | 'body' | 'action_label' | 'action_url' | 'is_active'
>;

const popupColumns =
  'slot_number, title, body, action_label, action_url, is_active, updated_at';

const requireSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase 프로젝트 정보가 설정되지 않았습니다.');
  }

  return supabase;
};

export async function getActiveHomePopups(): Promise<HomePopup[]> {
  const { data, error } = await requireSupabase()
    .from('home_popups')
    .select(popupColumns)
    .eq('is_active', true)
    .order('slot_number');

  if (error) {
    throw new Error('첫 팝업 정보를 불러오지 못했습니다.');
  }

  return (data ?? []) as HomePopup[];
}

export async function getAdminHomePopups(): Promise<HomePopup[]> {
  const { data, error } = await requireSupabase()
    .from('home_popups')
    .select(popupColumns)
    .order('slot_number');

  if (error) {
    throw new Error('첫 팝업 설정을 불러오지 못했습니다.');
  }

  return (data ?? []) as HomePopup[];
}

export async function updateHomePopups(popups: HomePopupInput[]) {
  if (popups.length !== 3) {
    throw new Error('팝업 슬롯 3개의 설정이 모두 필요합니다.');
  }

  const client = requireSupabase();

  for (const popup of popups) {
    const { error } = await client
      .from('home_popups')
      .update({
        title: popup.title.trim(),
        body: popup.body.trim(),
        action_label: popup.action_label.trim() || '자세히 보기',
        action_url: popup.action_url?.trim() || null,
        is_active: popup.is_active,
      })
      .eq('slot_number', popup.slot_number);

    if (error) {
      throw new Error(`${popup.slot_number}번 팝업을 저장하지 못했습니다.`);
    }
  }
}
