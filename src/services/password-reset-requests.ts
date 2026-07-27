import { supabase } from '../lib/supabase';

export type PasswordResetRequest = {
  id: string;
  requester_id: string;
  name: string;
  student_number: string;
  phone_number: string;
  reason: string | null;
  status: 'submitted' | 'completed' | 'rejected';
  created_at: string;
};

export type PasswordResetRequestInput = {
  name: string;
  studentNumber: string;
  phoneNumber: string;
  reason?: string;
};

type ProcessPasswordResetResult =
  | {
      status: 'completed';
      temporaryPassword: string;
    }
  | {
      status: 'rejected';
    };

const requireSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase 프로젝트 정보가 설정되지 않았습니다.');
  }

  return supabase;
};

export async function createPasswordResetRequest(
  input: PasswordResetRequestInput,
) {
  const client = requireSupabase();
  const { error } = await client.rpc('create_password_reset_request', {
    request_name: input.name.trim(),
    request_student_number: input.studentNumber.trim(),
    request_phone_number: input.phoneNumber.replace(/\D/g, ''),
    request_reason: input.reason?.trim() || null,
  });

  if (error) {
    throw new Error(
      '등록된 이름, 학번/사번, 휴대전화번호가 일치하지 않습니다.',
    );
  }
}

export async function getSubmittedPasswordResetRequests() {
  const client = requireSupabase();
  const { data, error } = await client
    .from('password_reset_requests')
    .select(
      'id, requester_id, name, student_number, phone_number, reason, status, created_at',
    )
    .eq('status', 'submitted')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error('비밀번호 재설정 요청을 불러오지 못했습니다.');
  }

  return (data ?? []) as PasswordResetRequest[];
}

export async function processPasswordResetRequest(
  requestId: string,
  action: 'issue' | 'reject',
) {
  const client = requireSupabase();
  const { data, error } = await client.functions.invoke(
    'process-password-reset',
    {
      body: {
        requestId,
        action,
      },
    },
  );

  if (error || !data) {
    throw new Error(
      action === 'issue'
        ? '임시 비밀번호를 발급하지 못했습니다.'
        : '재설정 요청을 반려하지 못했습니다.',
    );
  }

  return data as ProcessPasswordResetResult;
}
