import { supabase } from '../lib/supabase';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type StudentProfile = {
  id: string;
  student_number: string;
  name: string;
  grade: number;
  major: string;
  enrollment_status: string;
  role: 'student' | 'admin';
  approval_status: ApprovalStatus;
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
  | { status: 'approved'; profile: StudentProfile }
  | { status: 'pending' | 'rejected' };

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
      'id, student_number, name, grade, major, enrollment_status, role, approval_status',
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

  return { status: 'approved', profile };
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

export async function signOutStudent() {
  if (supabase) {
    await supabase.auth.signOut();
  }
}

export function getAuthErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : '요청을 처리하지 못했습니다. 다시 시도해 주세요.';
}
