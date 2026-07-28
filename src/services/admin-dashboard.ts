import { supabase } from '../lib/supabase';

export type PendingActionCounts = {
  students: number;
  equipment: number;
  rooms: number;
  facilities: number;
  inquiries: number;
  total: number;
};

export async function getPendingActionCounts(): Promise<PendingActionCounts> {
  if (!supabase) throw new Error('Supabase 프로젝트 정보가 설정되지 않았습니다.');
  const count = async (table: string, statuses: string[]) => {
    const { count: value, error } = await supabase!
      .from(table)
      .select('id', { count: 'exact', head: true })
      .in(table === 'profiles' ? 'approval_status' : 'status', statuses);
    if (error) throw error;
    return value ?? 0;
  };
  const [students, equipment, rooms, facilities, inquiries] = await Promise.all([
    count('profiles', ['pending']),
    count('equipment_rental_requests', ['submitted']),
    count('room_reservation_requests', ['submitted', 'received', 'erp_checking']),
    count('facility_reports', ['submitted', 'received', 'in_progress']),
    count('assistant_inquiries', ['submitted', 'in_progress']),
  ]);
  return {
    students,
    equipment,
    rooms,
    facilities,
    inquiries,
    total: students + equipment + rooms + facilities + inquiries,
  };
}
