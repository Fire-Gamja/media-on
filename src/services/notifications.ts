import { supabase } from '../lib/supabase';

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  route: string | null;
  is_read: boolean;
  created_at: string;
};

const requireClient = () => {
  if (!supabase) throw new Error('Supabase 프로젝트 정보가 설정되지 않았습니다.');
  return supabase;
};

export async function getMyNotifications() {
  const { data, error } = await requireClient()
    .from('app_notifications')
    .select('id, title, body, route, is_read, created_at')
    .order('created_at', { ascending: false });
  if (error) throw new Error('알림 내역을 불러오지 못했습니다.');
  return (data ?? []) as AppNotification[];
}

export async function markNotificationRead(id: string) {
  const { error } = await requireClient()
    .from('app_notifications')
    .update({ is_read: true })
    .eq('id', id);
  if (error) throw new Error('알림을 읽음 처리하지 못했습니다.');
}
