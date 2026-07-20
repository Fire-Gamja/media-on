import { supabase } from '../lib/supabase';

export type EquipmentRequestStatus =
  | 'submitted'
  | 'approved'
  | 'checked_out'
  | 'returned'
  | 'rejected';

export type EquipmentItem = {
  id: string;
  name: string;
  category: string;
  total_quantity: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type EquipmentRentalRequest = {
  id: string;
  requester_id: string;
  equipment_id: string;
  quantity: number;
  pickup_date: string;
  return_date: string;
  purpose: string;
  status: EquipmentRequestStatus;
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  equipment: EquipmentItemProfile | null;
};

export type AdminEquipmentRentalRequest = EquipmentRentalRequest & {
  requester: RequesterProfile | null;
};

export type EquipmentRentalInput = {
  equipmentId: string;
  quantity: number;
  pickupDate: string;
  returnDate: string;
  purpose: string;
};

type EquipmentItemProfile = {
  name: string;
  category: string;
  total_quantity: number;
};

type RequesterProfile = {
  name: string;
  student_number: string;
};

type EquipmentRentalRow = Omit<EquipmentRentalRequest, 'equipment'> & {
  equipment: EquipmentItemProfile | EquipmentItemProfile[] | null;
};

type AdminEquipmentRentalRow = EquipmentRentalRow & {
  requester: RequesterProfile | RequesterProfile[] | null;
};

export const EQUIPMENT_STATUS_OPTIONS: ReadonlyArray<{
  value: EquipmentRequestStatus;
  label: string;
}> = [
  { value: 'submitted', label: '신청 완료' },
  { value: 'approved', label: '승인 완료' },
  { value: 'checked_out', label: '대여 중' },
  { value: 'returned', label: '반납 완료' },
  { value: 'rejected', label: '반려' },
];

const equipmentColumns =
  'id, name, category, total_quantity, description, is_active, created_at, updated_at';
const requestColumns =
  'id, requester_id, equipment_id, quantity, pickup_date, return_date, purpose, status, admin_note, reviewed_by, reviewed_at, created_at, updated_at';
const equipmentJoin =
  'equipment:equipment_items!equipment_rental_requests_equipment_id_fkey(name, category, total_quantity)';
const requesterJoin =
  'requester:profiles!equipment_rental_requests_requester_id_fkey(name, student_number)';

const requireSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase 프로젝트 정보가 설정되지 않았습니다.');
  }

  return supabase;
};

export function getEquipmentStatusLabel(status: EquipmentRequestStatus) {
  return (
    EQUIPMENT_STATUS_OPTIONS.find((option) => option.value === status)?.label ??
    '신청 완료'
  );
}

export async function getEquipmentItems(): Promise<EquipmentItem[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('equipment_items')
    .select(equipmentColumns)
    .eq('is_active', true)
    .order('category')
    .order('name');

  if (error) {
    throw new Error('기자재 목록을 불러오지 못했습니다.');
  }

  return (data ?? []) as EquipmentItem[];
}

export async function getEquipmentItem(id: string): Promise<EquipmentItem> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('equipment_items')
    .select(equipmentColumns)
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    throw new Error('기자재 정보를 찾을 수 없습니다.');
  }

  return data as EquipmentItem;
}

export async function createEquipmentRentalRequest(
  input: EquipmentRentalInput,
) {
  const client = requireSupabase();
  const { error } = await client.from('equipment_rental_requests').insert({
    equipment_id: input.equipmentId,
    quantity: input.quantity,
    pickup_date: input.pickupDate,
    return_date: input.returnDate,
    purpose: input.purpose.trim(),
  });

  if (error) {
    throw new Error('기자재 대여를 신청하지 못했습니다.');
  }
}

export async function getMyEquipmentRentalRequests(
  limit?: number,
): Promise<EquipmentRentalRequest[]> {
  const client = requireSupabase();
  let query = client
    .from('equipment_rental_requests')
    .select(`${requestColumns}, ${equipmentJoin}`)
    .order('created_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error('내 기자재 대여 신청을 불러오지 못했습니다.');
  }

  return ((data ?? []) as unknown as EquipmentRentalRow[]).map(
    normalizeEquipmentRentalRequest,
  );
}

export async function getMyEquipmentRentalRequest(
  id: string,
): Promise<EquipmentRentalRequest> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('equipment_rental_requests')
    .select(`${requestColumns}, ${equipmentJoin}`)
    .eq('id', id)
    .single();

  if (error || !data) {
    throw new Error('기자재 대여 신청을 찾을 수 없습니다.');
  }

  return normalizeEquipmentRentalRequest(
    data as unknown as EquipmentRentalRow,
  );
}

export async function getAdminEquipmentRentalRequests(): Promise<
  AdminEquipmentRentalRequest[]
> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('equipment_rental_requests')
    .select(`${requestColumns}, ${equipmentJoin}, ${requesterJoin}`)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('기자재 대여 관리 목록을 불러오지 못했습니다.');
  }

  return ((data ?? []) as unknown as AdminEquipmentRentalRow[]).map(
    normalizeAdminEquipmentRentalRequest,
  );
}

export async function getAdminEquipmentRentalRequest(
  id: string,
): Promise<AdminEquipmentRentalRequest> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('equipment_rental_requests')
    .select(`${requestColumns}, ${equipmentJoin}, ${requesterJoin}`)
    .eq('id', id)
    .single();

  if (error || !data) {
    throw new Error('기자재 대여 신청을 찾을 수 없습니다.');
  }

  return normalizeAdminEquipmentRentalRequest(
    data as unknown as AdminEquipmentRentalRow,
  );
}

export async function transitionEquipmentRentalRequest(
  id: string,
  status: EquipmentRequestStatus,
  adminNote = '',
) {
  const client = requireSupabase();
  const { error } = await client.rpc('transition_equipment_rental_request', {
    target_request_id: id,
    new_status: status,
    note: adminNote.trim() || null,
  });

  if (error) {
    if (error.message.includes('not enough equipment')) {
      throw new Error('해당 기간에 승인 가능한 기자재 수량이 부족합니다.');
    }

    throw new Error('기자재 대여 처리 상태를 변경하지 못했습니다.');
  }
}

function normalizeEquipmentRentalRequest(
  request: EquipmentRentalRow,
): EquipmentRentalRequest {
  return {
    ...request,
    equipment: Array.isArray(request.equipment)
      ? (request.equipment[0] ?? null)
      : request.equipment,
  };
}

function normalizeAdminEquipmentRentalRequest(
  request: AdminEquipmentRentalRow,
): AdminEquipmentRentalRequest {
  return {
    ...normalizeEquipmentRentalRequest(request),
    requester: Array.isArray(request.requester)
      ? (request.requester[0] ?? null)
      : request.requester,
  };
}
