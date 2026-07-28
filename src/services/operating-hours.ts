import { supabase } from '../lib/supabase';

export type OperatingMode = 'vacation' | 'semester';

export type OperatingHoursSettings = {
  id: number;
  mode: OperatingMode;
  start_time: string;
  end_time: string;
  closed_note: string;
  updated_by: string | null;
  updated_at: string;
};

export const DEFAULT_OPERATING_HOURS: OperatingHoursSettings = {
  id: 1,
  mode: 'vacation',
  start_time: '09:00:00',
  end_time: '17:00:00',
  closed_note: '주말 및 공휴일 휴무',
  updated_by: null,
  updated_at: new Date(0).toISOString(),
};

const requireClient = () => {
  if (!supabase) {
    throw new Error('Supabase 프로젝트 정보가 설정되지 않았습니다.');
  }

  return supabase;
};

export async function getOperatingHoursSettings() {
  if (!supabase) {
    return DEFAULT_OPERATING_HOURS;
  }

  const { data, error } = await supabase
    .from('operating_hours_settings')
    .select(
      'id, mode, start_time, end_time, closed_note, updated_by, updated_at',
    )
    .eq('id', 1)
    .maybeSingle<OperatingHoursSettings>();

  if (error || !data) {
    return DEFAULT_OPERATING_HOURS;
  }

  return data;
}

export async function updateOperatingHoursSettings(input: {
  mode: OperatingMode;
  startTime: string;
  endTime: string;
}) {
  const { data, error } = await requireClient().rpc(
    'update_operating_hours_settings',
    {
      next_mode: input.mode,
      next_start_time: input.startTime,
      next_end_time: input.endTime,
    },
  );

  if (error || !data) {
    throw new Error('운영시간을 저장하지 못했습니다.');
  }

  return data as OperatingHoursSettings;
}

export function formatOperatingHours(
  settings: OperatingHoursSettings,
) {
  return {
    title:
      settings.mode === 'vacation' ? '방학 중 운영시간' : '운영 시간',
    description: `평일 ${settings.start_time.slice(
      0,
      5,
    )} ~ ${settings.end_time.slice(0, 5)}ㆍ${settings.closed_note}`,
  };
}
