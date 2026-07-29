import { supabase } from '../lib/supabase';

export type PreGraduationWeekday = 1 | 2 | 3 | 4 | 5;

export type PreGraduationSettings = {
  id: number;
  access_enabled: boolean;
  enabled_weekdays: PreGraduationWeekday[];
  updated_by: string | null;
  updated_at: string;
};

export type PreGraduationSlot = {
  weekday: PreGraduationWeekday;
  slot_start: string;
  slot_end: string;
  reservation_id: string | null;
  student_name: string | null;
  student_number: string | null;
  is_mine: boolean;
};

export const PRE_GRADUATION_WEEKDAYS: ReadonlyArray<{
  value: PreGraduationWeekday;
  label: string;
  fullLabel: string;
}> = [
  { value: 1, label: '월', fullLabel: '월요일' },
  { value: 2, label: '화', fullLabel: '화요일' },
  { value: 3, label: '수', fullLabel: '수요일' },
  { value: 4, label: '목', fullLabel: '목요일' },
  { value: 5, label: '금', fullLabel: '금요일' },
];

export const DEFAULT_PRE_GRADUATION_SETTINGS: PreGraduationSettings = {
  id: 1,
  access_enabled: false,
  enabled_weekdays: [],
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
  if (!supabase) {
    return DEFAULT_PRE_GRADUATION_SETTINGS;
  }

  const { data, error } = await supabase
    .from('pre_graduation_settings')
    .select(
      'id, access_enabled, enabled_weekdays, updated_by, updated_at',
    )
    .eq('id', 1)
    .maybeSingle<PreGraduationSettings>();

  if (error || !data) {
    throw new Error('예비졸업사정 신청 설정을 불러오지 못했습니다.');
  }

  return {
    ...data,
    enabled_weekdays: normalizeWeekdays(data.enabled_weekdays),
  };
}

export async function updatePreGraduationSettings(input: {
  accessEnabled: boolean;
  enabledWeekdays: PreGraduationWeekday[];
}) {
  const { data, error } = await requireClient().rpc(
    'update_pre_graduation_settings',
    {
      next_access_enabled: input.accessEnabled,
      next_enabled_weekdays: normalizeWeekdays(input.enabledWeekdays),
    },
  );

  if (error || !data) {
    throwPreGraduationError(
      error,
      '예비졸업사정 신청 설정을 저장하지 못했습니다.',
    );
  }

  const settings = data as PreGraduationSettings;
  return {
    ...settings,
    enabled_weekdays: normalizeWeekdays(settings.enabled_weekdays),
  };
}

export async function getPreGraduationSchedule() {
  const { data, error } = await requireClient().rpc(
    'get_pre_graduation_schedule',
  );

  if (error) {
    throwPreGraduationError(
      error,
      '예비졸업사정 예약 현황을 불러오지 못했습니다.',
    );
  }

  return ((data ?? []) as PreGraduationSlot[]).map((slot) => ({
    ...slot,
    slot_start: slot.slot_start.slice(0, 5),
    slot_end: slot.slot_end.slice(0, 5),
    is_mine: slot.is_mine === true,
  }));
}

export async function reservePreGraduationSlot(input: {
  weekday: PreGraduationWeekday;
  startTime: string;
}) {
  const { data, error } = await requireClient().rpc(
    'reserve_pre_graduation_slot',
    {
      requested_weekday: input.weekday,
      requested_start_time: input.startTime,
    },
  );

  if (error || !data) {
    throwPreGraduationError(
      error,
      '예비졸업사정 예약을 완료하지 못했습니다.',
    );
  }

  return data as string;
}

export async function cancelPreGraduationReservation(
  reservationId: string,
) {
  const { error } = await requireClient().rpc(
    'cancel_pre_graduation_reservation',
    {
      target_reservation_id: reservationId,
    },
  );

  if (error) {
    throwPreGraduationError(
      error,
      '예비졸업사정 예약을 취소하지 못했습니다.',
    );
  }
}

export function getPreGraduationWeekdayLabel(
  weekday: PreGraduationWeekday,
  full = false,
) {
  const option = PRE_GRADUATION_WEEKDAYS.find(
    (item) => item.value === weekday,
  );
  return full ? option?.fullLabel ?? '' : option?.label ?? '';
}

function normalizeWeekdays(
  weekdays: readonly number[] | null | undefined,
): PreGraduationWeekday[] {
  return Array.from(
    new Set(
      (weekdays ?? []).filter(
        (weekday): weekday is PreGraduationWeekday =>
          Number.isInteger(weekday) && weekday >= 1 && weekday <= 5,
      ),
    ),
  ).sort((left, right) => left - right);
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
  if (message.includes('PRE_GRADUATION_WEEKDAY_REQUIRED')) {
    throw new Error('신청받을 요일을 한 개 이상 선택해 주세요.');
  }
  if (message.includes('PRE_GRADUATION_WEEKDAY_CLOSED')) {
    throw new Error('현재 신청을 받지 않는 요일입니다.');
  }
  if (message.includes('PRE_GRADUATION_ALREADY_RESERVED')) {
    throw new Error('이미 예약한 시간이 있습니다. 기존 예약을 먼저 취소해 주세요.');
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
