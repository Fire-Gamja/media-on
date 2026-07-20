import { supabase } from '../lib/supabase';

export type RoomReservationStatus =
  | 'submitted'
  | 'approved'
  | 'completed'
  | 'rejected';

export type PracticeRoom = {
  id: string;
  name: string;
  location: string;
  capacity: number;
  open_time: string;
  close_time: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type RoomProfile = {
  name: string;
  location: string;
  capacity: number;
  open_time: string;
  close_time: string;
};

type RequesterProfile = {
  name: string;
  student_number: string;
};

export type RoomReservationRequest = {
  id: string;
  requester_id: string;
  room_id: string;
  reservation_date: string;
  start_time: string;
  end_time: string;
  attendee_count: number;
  purpose: string;
  status: RoomReservationStatus;
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  room: RoomProfile | null;
};

export type AdminRoomReservationRequest = RoomReservationRequest & {
  requester: RequesterProfile | null;
};

export type RoomReservationInput = {
  roomId: string;
  reservationDate: string;
  startTime: string;
  endTime: string;
  attendeeCount: number;
  purpose: string;
};

type RoomReservationRow = Omit<RoomReservationRequest, 'room'> & {
  room: RoomProfile | RoomProfile[] | null;
};

type AdminRoomReservationRow = RoomReservationRow & {
  requester: RequesterProfile | RequesterProfile[] | null;
};

export const ROOM_STATUS_OPTIONS: ReadonlyArray<{
  value: RoomReservationStatus;
  label: string;
}> = [
  { value: 'submitted', label: '신청 완료' },
  { value: 'approved', label: '승인 완료' },
  { value: 'completed', label: '이용 완료' },
  { value: 'rejected', label: '반려' },
];

const roomColumns =
  'id, name, location, capacity, open_time, close_time, description, is_active, created_at, updated_at';
const requestColumns =
  'id, requester_id, room_id, reservation_date, start_time, end_time, attendee_count, purpose, status, admin_note, reviewed_by, reviewed_at, created_at, updated_at';
const roomJoin =
  'room:practice_rooms!room_reservation_requests_room_id_fkey(name, location, capacity, open_time, close_time)';
const requesterJoin =
  'requester:profiles!room_reservation_requests_requester_id_fkey(name, student_number)';

const requireSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase 프로젝트 정보가 설정되지 않았습니다.');
  }

  return supabase;
};

export function getRoomStatusLabel(status: RoomReservationStatus) {
  return (
    ROOM_STATUS_OPTIONS.find((option) => option.value === status)?.label ??
    '신청 완료'
  );
}

export async function getPracticeRooms(): Promise<PracticeRoom[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('practice_rooms')
    .select(roomColumns)
    .eq('is_active', true)
    .order('name');

  if (error) {
    throw new Error('실습실 목록을 불러오지 못했습니다.');
  }

  return (data ?? []) as PracticeRoom[];
}

export async function getPracticeRoom(id: string): Promise<PracticeRoom> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('practice_rooms')
    .select(roomColumns)
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    throw new Error('실습실 정보를 찾을 수 없습니다.');
  }

  return data as PracticeRoom;
}

export async function createRoomReservationRequest(
  input: RoomReservationInput,
) {
  const client = requireSupabase();
  const { error } = await client.from('room_reservation_requests').insert({
    room_id: input.roomId,
    reservation_date: input.reservationDate,
    start_time: input.startTime,
    end_time: input.endTime,
    attendee_count: input.attendeeCount,
    purpose: input.purpose.trim(),
  });

  if (error) {
    throw new Error('실습실 대여를 신청하지 못했습니다.');
  }
}

export async function getMyRoomReservationRequests(
  limit?: number,
): Promise<RoomReservationRequest[]> {
  const client = requireSupabase();
  let query = client
    .from('room_reservation_requests')
    .select(`${requestColumns}, ${roomJoin}`)
    .order('created_at', { ascending: false });

  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) {
    throw new Error('내 실습실 대여 신청을 불러오지 못했습니다.');
  }

  return ((data ?? []) as unknown as RoomReservationRow[]).map(
    normalizeRoomReservationRequest,
  );
}

export async function getMyRoomReservationRequest(
  id: string,
): Promise<RoomReservationRequest> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('room_reservation_requests')
    .select(`${requestColumns}, ${roomJoin}`)
    .eq('id', id)
    .single();

  if (error || !data) {
    throw new Error('실습실 대여 신청을 찾을 수 없습니다.');
  }

  return normalizeRoomReservationRequest(
    data as unknown as RoomReservationRow,
  );
}

export async function getAdminRoomReservationRequests(): Promise<
  AdminRoomReservationRequest[]
> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('room_reservation_requests')
    .select(`${requestColumns}, ${roomJoin}, ${requesterJoin}`)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('실습실 대여 관리 목록을 불러오지 못했습니다.');
  }

  return ((data ?? []) as unknown as AdminRoomReservationRow[]).map(
    normalizeAdminRoomReservationRequest,
  );
}

export async function getAdminRoomReservationRequest(
  id: string,
): Promise<AdminRoomReservationRequest> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('room_reservation_requests')
    .select(`${requestColumns}, ${roomJoin}, ${requesterJoin}`)
    .eq('id', id)
    .single();

  if (error || !data) {
    throw new Error('실습실 대여 신청을 찾을 수 없습니다.');
  }

  return normalizeAdminRoomReservationRequest(
    data as unknown as AdminRoomReservationRow,
  );
}

export async function transitionRoomReservationRequest(
  id: string,
  status: RoomReservationStatus,
  adminNote = '',
) {
  const client = requireSupabase();
  const { error } = await client.rpc('transition_room_reservation_request', {
    target_request_id: id,
    new_status: status,
    note: adminNote.trim() || null,
  });

  if (error) {
    if (error.message.includes('already reserved')) {
      throw new Error('해당 시간에는 이미 승인된 실습실 예약이 있습니다.');
    }
    throw new Error('실습실 대여 처리 상태를 변경하지 못했습니다.');
  }
}

function normalizeRoomReservationRequest(
  request: RoomReservationRow,
): RoomReservationRequest {
  return {
    ...request,
    room: Array.isArray(request.room) ? (request.room[0] ?? null) : request.room,
  };
}

function normalizeAdminRoomReservationRequest(
  request: AdminRoomReservationRow,
): AdminRoomReservationRequest {
  return {
    ...normalizeRoomReservationRequest(request),
    requester: Array.isArray(request.requester)
      ? (request.requester[0] ?? null)
      : request.requester,
  };
}
