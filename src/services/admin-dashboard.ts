import { supabase } from '../lib/supabase';

export type PendingActionKind =
  | 'equipment'
  | 'room'
  | 'facility'
  | 'inquiry';

export type PendingActionCounts = {
  students: number;
  equipment: number;
  rooms: number;
  facilities: number;
  inquiries: number;
  total: number;
};

export type PendingAction = {
  id: string;
  kind: PendingActionKind;
  category: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
};

type EquipmentPendingRow = {
  id: string;
  purpose: string;
  status: string;
  created_at: string;
};

type RoomPendingRow = {
  id: string;
  purpose: string;
  status: string;
  created_at: string;
};

type FacilityPendingRow = {
  id: string;
  title: string;
  location: string;
  status: string;
  created_at: string;
};

type InquiryPendingRow = {
  id: string;
  title: string;
  status: string;
  created_at: string;
};

const requireSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase 프로젝트 정보가 설정되지 않았습니다.');
  }

  return supabase;
};

export async function getPendingActionCounts(): Promise<PendingActionCounts> {
  const client = requireSupabase();
  const count = async (table: string, statuses: string[]) => {
    const { count: value, error } = await client
      .from(table)
      .select('id', { count: 'exact', head: true })
      .in(table === 'profiles' ? 'approval_status' : 'status', statuses);

    if (error) throw error;
    return value ?? 0;
  };

  const [students, equipment, rooms, facilities, inquiries] =
    await Promise.all([
      count('profiles', ['pending']),
      count('equipment_rental_requests', ['submitted']),
      count('room_reservation_requests', [
        'submitted',
        'received',
        'erp_checking',
      ]),
      count('facility_reports', ['submitted', 'received', 'in_progress']),
      count('assistant_inquiries', ['submitted', 'in_progress']),
    ]);

  return {
    students,
    equipment,
    rooms,
    facilities,
    inquiries,
    total: equipment + rooms + facilities + inquiries,
  };
}

export async function getPendingActions(): Promise<PendingAction[]> {
  const client = requireSupabase();
  const [equipmentResult, roomResult, facilityResult, inquiryResult] =
    await Promise.all([
      client
        .from('equipment_rental_requests')
        .select('id, purpose, status, created_at')
        .eq('status', 'submitted')
        .order('created_at', { ascending: true }),
      client
        .from('room_reservation_requests')
        .select('id, purpose, status, created_at')
        .in('status', ['submitted', 'received', 'erp_checking'])
        .order('created_at', { ascending: true }),
      client
        .from('facility_reports')
        .select('id, title, location, status, created_at')
        .in('status', ['submitted', 'received', 'in_progress'])
        .order('created_at', { ascending: true }),
      client
        .from('assistant_inquiries')
        .select('id, title, status, created_at')
        .in('status', ['submitted', 'in_progress'])
        .order('created_at', { ascending: true }),
    ]);

  const firstError = [
    equipmentResult.error,
    roomResult.error,
    facilityResult.error,
    inquiryResult.error,
  ].find(Boolean);

  if (firstError) {
    throw new Error('조치 대기 목록을 불러오지 못했습니다.');
  }

  const equipment = (equipmentResult.data ?? []) as EquipmentPendingRow[];
  const rooms = (roomResult.data ?? []) as RoomPendingRow[];
  const facilities = (facilityResult.data ?? []) as FacilityPendingRow[];
  const inquiries = (inquiryResult.data ?? []) as InquiryPendingRow[];

  return [
    ...equipment.map(
      (item): PendingAction => ({
        id: item.id,
        kind: 'equipment',
        category: '기자재 대여',
        title: '기자재 대여 신청 확인',
        description: item.purpose,
        status: getPendingStatusLabel('equipment', item.status),
        createdAt: item.created_at,
      }),
    ),
    ...rooms.map(
      (item): PendingAction => ({
        id: item.id,
        kind: 'room',
        category: '실습실 대여',
        title: '실습실 대여 신청 확인',
        description: item.purpose,
        status: getPendingStatusLabel('room', item.status),
        createdAt: item.created_at,
      }),
    ),
    ...facilities.map(
      (item): PendingAction => ({
        id: item.id,
        kind: 'facility',
        category: '시설 신고',
        title: item.title,
        description: item.location,
        status: getPendingStatusLabel('facility', item.status),
        createdAt: item.created_at,
      }),
    ),
    ...inquiries.map(
      (item): PendingAction => ({
        id: item.id,
        kind: 'inquiry',
        category: '조교 문의',
        title: item.title,
        description:
          item.status === 'submitted'
            ? '채팅 시작을 기다리고 있습니다.'
            : '상담이 진행 중입니다.',
        status: getPendingStatusLabel('inquiry', item.status),
        createdAt: item.created_at,
      }),
    ),
  ].sort(
    (left, right) =>
      new Date(left.createdAt).getTime() -
      new Date(right.createdAt).getTime(),
  );
}

function getPendingStatusLabel(kind: PendingActionKind, status: string) {
  if (kind === 'inquiry') {
    return status === 'submitted' ? '문의 완료' : '상담 중';
  }

  if (kind === 'room') {
    if (status === 'received') return '접수 완료';
    if (status === 'erp_checking') return 'ERP 확인 중';
  }

  if (kind === 'facility') {
    if (status === 'received') return '접수 완료';
    if (status === 'in_progress') return '조치 중';
  }

  return '신청 완료';
}
