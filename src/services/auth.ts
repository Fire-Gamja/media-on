import { supabase } from '../lib/supabase';
import { disablePushForCurrentDevice } from './push-notifications';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type StudentProfile = {
  id: string;
  student_number: string;
  name: string;
  grade: number;
  major: string;
  enrollment_status: string;
  phone_number: string;
  role: 'student' | 'admin';
  approval_status: ApprovalStatus;
};

export type AdminStudentProfile = StudentProfile & {
  created_at: string;
};

export type ProfileUpdateInput = {
  name: string;
  grade: number;
  major: string;
  enrollmentStatus: string;
  phoneNumber: string;
};

export type StudentSignupInput = {
  name: string;
  studentNumber: string;
  password: string;
  grade: number;
  major: string;
  enrollmentStatus: string;
  phoneNumber: string;
  privacyAgreed: boolean;
  termsAgreed: boolean;
  marketingAgreed: boolean;
};

export type StudentLoginResult =
  | {
      status: 'approved';
      profile: StudentProfile;
      requiresPasswordChange: boolean;
    }
  | { status: 'pending' }
  | { status: 'rejected' };

const studentNumberToEmail = (studentNumber: string) =>
  `${studentNumber.trim()}@student.media-on.app`;

const requireSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase 프로젝트 정보가 설정되지 않았습니다.');
  }

  return supabase;
};

export async function signInStudent(
  studentNumber: string,
  password: string,
): Promise<StudentLoginResult> {
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithPassword({
    email: studentNumberToEmail(studentNumber),
    password,
  });

  if (error || !data.user) {
    throw new Error('학번 또는 비밀번호가 올바르지 않습니다.');
  }

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select(
      'id, student_number, name, grade, major, enrollment_status, phone_number, role, approval_status',
    )
    .eq('id', data.user.id)
    .single<StudentProfile>();

  if (profileError || !profile) {
    await client.auth.signOut();
    throw new Error('학생 프로필을 불러올 수 없습니다.');
  }

  if (profile.approval_status !== 'approved') {
    await client.auth.signOut();
    return { status: profile.approval_status };
  }

  return {
    status: 'approved',
    profile,
    requiresPasswordChange:
      data.user.user_metadata?.must_change_password === true,
  };
}

export async function registerStudent(input: StudentSignupInput) {
  const client = requireSupabase();
  const { error } = await client.auth.signUp({
    email: studentNumberToEmail(input.studentNumber),
    password: input.password,
    options: {
      data: {
        student_number: input.studentNumber.trim(),
        name: input.name.trim(),
        grade: input.grade,
        major: input.major,
        enrollment_status: input.enrollmentStatus,
        phone_number: input.phoneNumber.replace(/\D/g, ''),
        privacy_agreed: input.privacyAgreed,
        terms_agreed: input.termsAgreed,
        marketing_agreed: input.marketingAgreed,
      },
    },
  });

  if (error) {
    if (
      error.message.includes('already registered') ||
      error.message.includes('Database error saving new user')
    ) {
      throw new Error('이미 가입 신청된 학번입니다.');
    }

    throw new Error('가입 신청을 저장하지 못했습니다. 다시 시도해 주세요.');
  }

  await client.auth.signOut();
}

export async function getPendingStudents(): Promise<AdminStudentProfile[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('profiles')
    .select(
      'id, student_number, name, grade, major, enrollment_status, phone_number, role, approval_status, created_at',
    )
    .eq('role', 'student')
    .eq('approval_status', 'pending')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error('가입 대기 목록을 불러오지 못했습니다.');
  }

  return (data ?? []) as AdminStudentProfile[];
}

export async function getApprovedStudentCount(): Promise<number> {
  const client = requireSupabase();
  const { count, error } = await client
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'student')
    .eq('approval_status', 'approved');

  if (error) {
    throw new Error('학생 수를 불러오지 못했습니다.');
  }

  return count ?? 0;
}

export async function reviewStudentAccount(
  userId: string,
  decision: Exclude<ApprovalStatus, 'pending'>,
) {
  const client = requireSupabase();
  const { error } = await client.rpc('review_student_account', {
    target_user_id: userId,
    decision,
  });

  if (error) {
    throw new Error(
      decision === 'approved'
        ? '학생 계정을 승인하지 못했습니다.'
        : '학생 계정을 거절 처리하지 못했습니다.',
    );
  }
}

export async function getCurrentProfile(): Promise<StudentProfile> {
  const client = requireSupabase();
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError || !user) {
    throw new Error('로그인 정보를 확인할 수 없습니다. 다시 로그인해 주세요.');
  }

  const { data, error } = await client
    .from('profiles')
    .select(
      'id, student_number, name, grade, major, enrollment_status, phone_number, role, approval_status',
    )
    .eq('id', user.id)
    .single<StudentProfile>();

  if (error || !data) {
    throw new Error('내 정보를 불러오지 못했습니다.');
  }

  return data;
}

export async function updateCurrentProfile(
  input: ProfileUpdateInput,
): Promise<StudentProfile> {
  const client = requireSupabase();
  const { data, error } = await client.rpc('update_my_profile', {
    profile_name: input.name.trim(),
    profile_grade: input.grade,
    profile_major: input.major,
    profile_enrollment_status: input.enrollmentStatus,
    profile_phone_number: input.phoneNumber.replace(/\D/g, ''),
  });

  if (error || !data) {
    throw new Error('내 정보를 저장하지 못했습니다. 다시 시도해 주세요.');
  }

  return data as StudentProfile;
}

export async function changeCurrentPassword(
  currentPassword: string,
  newPassword: string,
) {
  const client = requireSupabase();
  const { error: updateError } = await client.auth.updateUser({
    password: newPassword,
    current_password: currentPassword,
  });

  if (updateError) {
    throw new Error(
      '비밀번호를 변경하지 못했습니다. 현재 비밀번호를 확인하고 다시 시도해 주세요.',
    );
  }

  const { error: metadataError } = await client.auth.updateUser({
    data: { must_change_password: false },
  });

  if (metadataError) {
    throw new Error(
      '비밀번호는 변경되었지만 계정 상태를 갱신하지 못했습니다. 다시 로그인해 주세요.',
    );
  }
}

export async function signOutUser() {
  if (supabase) {
    await disablePushForCurrentDevice();
    await supabase.auth.signOut();
  }
}

export function getAuthErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : '요청을 처리하지 못했습니다. 다시 시도해 주세요.';
}
