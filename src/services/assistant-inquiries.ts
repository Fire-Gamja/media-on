import { supabase } from '../lib/supabase';

export type AssistantInquiryCategory =
  | 'academic'
  | 'equipment'
  | 'room'
  | 'facility'
  | 'other';

export type AssistantInquiryStatus =
  | 'submitted'
  | 'in_progress'
  | 'answered';

type RequesterProfile = {
  name: string;
  student_number: string;
};

export type AssistantInquiry = {
  id: string;
  requester_id: string;
  category: AssistantInquiryCategory;
  title: string;
  content: string;
  status: AssistantInquiryStatus;
  answer: string | null;
  answered_by: string | null;
  answered_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminAssistantInquiry = AssistantInquiry & {
  requester: RequesterProfile | null;
};

export type AssistantInquiryInput = {
  category: AssistantInquiryCategory;
  title: string;
  content: string;
};

type AdminAssistantInquiryRow = AssistantInquiry & {
  requester: RequesterProfile | RequesterProfile[] | null;
};

export const ASSISTANT_CATEGORY_OPTIONS: ReadonlyArray<{
  value: AssistantInquiryCategory;
  label: string;
}> = [
  { value: 'academic', label: '수강·학사' },
  { value: 'equipment', label: '기자재 대여' },
  { value: 'room', label: '실습실 대여' },
  { value: 'facility', label: '시설·환경' },
  { value: 'other', label: '기타' },
];

export const ASSISTANT_STATUS_OPTIONS: ReadonlyArray<{
  value: AssistantInquiryStatus;
  label: string;
}> = [
  { value: 'submitted', label: '접수 완료' },
  { value: 'in_progress', label: '답변 준비 중' },
  { value: 'answered', label: '답변 완료' },
];

const inquiryColumns =
  'id, requester_id, category, title, content, status, answer, answered_by, answered_at, created_at, updated_at';
const requesterJoin =
  'requester:profiles!assistant_inquiries_requester_id_fkey(name, student_number)';

const requireSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase 프로젝트 정보가 설정되지 않았습니다.');
  }
  return supabase;
};

export function getAssistantCategoryLabel(category: AssistantInquiryCategory) {
  return (
    ASSISTANT_CATEGORY_OPTIONS.find((option) => option.value === category)
      ?.label ?? '기타'
  );
}

export function getAssistantStatusLabel(status: AssistantInquiryStatus) {
  return (
    ASSISTANT_STATUS_OPTIONS.find((option) => option.value === status)?.label ??
    '접수 완료'
  );
}

export async function createAssistantInquiry(input: AssistantInquiryInput) {
  const client = requireSupabase();
  const { error } = await client.from('assistant_inquiries').insert({
    category: input.category,
    title: input.title.trim(),
    content: input.content.trim(),
  });
  if (error) throw new Error('조교 문의를 접수하지 못했습니다.');
}

export async function getMyAssistantInquiries(
  limit?: number,
): Promise<AssistantInquiry[]> {
  const client = requireSupabase();
  let query = client
    .from('assistant_inquiries')
    .select(inquiryColumns)
    .order('created_at', { ascending: false });
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw new Error('내 조교 문의를 불러오지 못했습니다.');
  return (data ?? []) as AssistantInquiry[];
}

export async function getMyAssistantInquiry(id: string): Promise<AssistantInquiry> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('assistant_inquiries')
    .select(inquiryColumns)
    .eq('id', id)
    .single();
  if (error || !data) throw new Error('조교 문의를 찾을 수 없습니다.');
  return data as AssistantInquiry;
}

export async function getAdminAssistantInquiries(): Promise<
  AdminAssistantInquiry[]
> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('assistant_inquiries')
    .select(`${inquiryColumns}, ${requesterJoin}`)
    .order('created_at', { ascending: false });
  if (error) throw new Error('조교 문의 관리 목록을 불러오지 못했습니다.');
  return ((data ?? []) as unknown as AdminAssistantInquiryRow[]).map(
    normalizeAdminInquiry,
  );
}

export async function getAdminAssistantInquiry(
  id: string,
): Promise<AdminAssistantInquiry> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('assistant_inquiries')
    .select(`${inquiryColumns}, ${requesterJoin}`)
    .eq('id', id)
    .single();
  if (error || !data) throw new Error('조교 문의를 찾을 수 없습니다.');
  return normalizeAdminInquiry(data as unknown as AdminAssistantInquiryRow);
}

export async function transitionAssistantInquiry(
  id: string,
  status: AssistantInquiryStatus,
  answer = '',
) {
  const client = requireSupabase();
  const { error } = await client.rpc('transition_assistant_inquiry', {
    target_inquiry_id: id,
    new_status: status,
    reply: answer.trim() || null,
  });
  if (error) throw new Error('조교 문의 상태를 변경하지 못했습니다.');
}

function normalizeAdminInquiry(
  inquiry: AdminAssistantInquiryRow,
): AdminAssistantInquiry {
  return {
    ...inquiry,
    requester: Array.isArray(inquiry.requester)
      ? (inquiry.requester[0] ?? null)
      : inquiry.requester,
  };
}
