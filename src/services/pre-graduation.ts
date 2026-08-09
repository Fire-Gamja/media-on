import { supabase } from '../lib/supabase';

export type PreGraduationSettings = {
  id: number;
  access_enabled: boolean;
  enabled_dates: string[];
  updated_by: string | null;
  updated_at: string;
};

export type PreGraduationSlot = {
  reservation_date: string;
  weekday: number;
  slot_start: string;
  slot_end: string;
  reservation_id: string | null;
  student_name: string | null;
  student_number: string | null;
  is_mine: boolean;
};

export const DEFAULT_PRE_GRADUATION_SETTINGS: PreGraduationSettings = {
  id: 1,
  access_enabled: false,
  enabled_dates: [],
  updated_by: null,
  updated_at: new Date(0).toISOString(),
};

const requireClient = () => {
  if (!supabase) {
    throw new Error('Supabase 프로젝트 정보가 설정되지 않았습니다.');
  }

  return supabase;
};

export async function getPreGraduationSettings() {
  if (!supabase) return DEFAULT_PRE_GRADUATION_SETTINGS;

  const { data, error } = await supabase
    .from('pre_graduation_settings')
    .select('id, access_enabled, enabled_dates, updated_by, updated_at')
    .eq('id', 1)
    .maybeSingle<PreGraduationSettings>();

  if (error || !data) {
    throw new Error('예비졸업사정 신청 설정을 불러오지 못했습니다.');
  }

  return { ...data, enabled_dates: normalizeDates(data.enabled_dates) };
}

export async function updatePreGraduationSettings(input: {
  accessEnabled: boolean;
  enabledDates: string[];
}) {
  const { data, error } = await requireClient().rpc(
    'update_pre_graduation_settings',
    {
      next_access_enabled: input.accessEnabled,
      next_enabled_dates: normalizeDates(input.enabledDates),
    },
  );

  if (error || !data) {
    throwPreGraduationError(error, '예비졸업사정 신청 설정을 저장하지 못했습니다.');
  }

  const settings = data as PreGraduationSettings;
  return { ...settings, enabled_dates: normalizeDates(settings.enabled_dates) };
}

export async function getPreGraduationSchedule() {
  const { data, error } = await requireClient().rpc('get_pre_graduation_schedule');

  if (error) {
    throwPreGraduationError(error, '예비졸업사정 예약 현황을 불러오지 못했습니다.');
  }

  return ((data ?? []) as PreGraduationSlot[]).map((slot) => ({
    ...slot,
    slot_start: slot.slot_start.slice(0, 5),
    slot_end: slot.slot_end.slice(0, 5),
    is_mine: slot.is_mine === true,
  }));
}

export async function reservePreGraduationSlot(input: {
  reservationDate: string;
  startTime: string;
}) {
  const { data, error } = await requireClient().rpc(
    'reserve_pre_graduation_slot',
    {
      requested_reservation_date: input.reservationDate,
      requested_start_time: input.startTime,
    },
  );

  if (error || !data) {
    throwPreGraduationError(error, '예비졸업사정 예약을 완료하지 못했습니다.');
  }

  return data as string;
}

export async function cancelPreGraduationReservation(reservationId: string) {
  const { error } = await requireClient().rpc(
    'cancel_pre_graduation_reservation',
    { target_reservation_id: reservationId },
  );

  if (error) {
    throwPreGraduationError(error, '예비졸업사정 예약을 취소하지 못했습니다.');
  }
}

export function formatPreGraduationDate(
  dateKey: string,
  locale = 'ko-KR',
  includeYear = false,
) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat(locale, {
    ...(includeYear ? { year: 'numeric' as const } : {}),
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(date);
}

function normalizeDates(dates: readonly string[] | null | undefined) {
  return Array.from(
    new Set((dates ?? []).filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))),
  ).sort();
}

function throwPreGraduationError(
  error: { message?: string } | null,
  fallback: string,
): never {
  const message = error?.message ?? '';

  if (message.includes('PRE_GRADUATION_GRADE_RESTRICTED')) {
    throw new Error('4학년 학생만 예비졸업사정을 신청할 수 있습니다.');
  }
  if (message.includes('PRE_GRADUATION_ACCESS_CLOSED')) {
    throw new Error('현재 예비졸업사정 신청 기간이 아닙니다.');
  }
  if (message.includes('PRE_GRADUATION_DATE_REQUIRED')) {
    throw new Error('신청받을 날짜를 한 개 이상 선택해 주세요.');
  }
  if (message.includes('PRE_GRADUATION_DATE_CLOSED')) {
    throw new Error('현재 신청을 받지 않는 날짜입니다.');
  }
  if (message.includes('PRE_GRADUATION_SLOT_TAKEN')) {
    throw new Error('방금 다른 학생이 예약한 시간입니다. 다른 시간을 선택해 주세요.');
  }
  if (message.includes('PRE_GRADUATION_INVALID_TIME')) {
    throw new Error('신청 가능한 시간이 아닙니다.');
  }
  if (message.includes('PRE_GRADUATION_RESERVATION_NOT_FOUND')) {
    throw new Error('예약 정보를 찾을 수 없습니다. 목록을 새로고침해 주세요.');
  }

  throw new Error(fallback);
}
