import { supabase } from '../lib/supabase';
import { maskProfanity } from '../lib/content-filter';
import { sendPushNotificationEvent } from './push-notifications';

export type AssistantInquiryCategory =
  | 'academic'
  | 'equipment'
  | 'room'
  | 'facility'
  | 'other';

export type AssistantInquiryGroup = 'practice' | 'administration';

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

export type AssistantMessage = {
  id: string;
  inquiry_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export type AdminAssistantInquiry = AssistantInquiry & {
  requester: RequesterProfile | null;
};

export type AssistantInquiryInput = {
  category: AssistantInquiryCategory;
  title: string;
  content: string;
};

export type AssistantInquirySuggestion = {
  category: AssistantInquiryCategory;
  title: string;
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

export const ASSISTANT_CATEGORY_GROUPS: ReadonlyArray<{
  value: AssistantInquiryGroup;
  label: string;
  categories: readonly AssistantInquiryCategory[];
}> = [
  {
    value: 'practice',
    label: '실습',
    categories: ['equipment', 'room', 'facility'],
  },
  {
    value: 'administration',
    label: '행정',
    categories: ['academic', 'other'],
  },
];

export const ASSISTANT_STATUS_OPTIONS: ReadonlyArray<{
  value: AssistantInquiryStatus;
  label: string;
}> = [
  { value: 'submitted', label: '문의 완료' },
  { value: 'in_progress', label: '상담 중' },
  { value: 'answered', label: '상담 완료' },
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

export function getAssistantCategoryGroup(
  category: AssistantInquiryCategory,
): AssistantInquiryGroup {
  return (
    ASSISTANT_CATEGORY_GROUPS.find((group) =>
      group.categories.includes(category),
    )?.value ?? 'administration'
  );
}

export function getAssistantCategoryOptionsForGroup(
  group: AssistantInquiryGroup,
) {
  const categoryValues =
    ASSISTANT_CATEGORY_GROUPS.find((option) => option.value === group)
      ?.categories ?? [];

  return ASSISTANT_CATEGORY_OPTIONS.filter((option) =>
    categoryValues.includes(option.value),
  );
}

export function getAssistantStatusLabel(status: AssistantInquiryStatus) {
  return (
    ASSISTANT_STATUS_OPTIONS.find((option) => option.value === status)?.label ??
    '문의 완료'
  );
}

export async function suggestAssistantInquiry(
  content: string,
): Promise<AssistantInquirySuggestion> {
  const client = requireSupabase();
  const { data, error } = await client.functions.invoke(
    'suggest-assistant-inquiry',
    { body: { content: content.trim() } },
  );

  if (error || !data) {
    throw new Error('AI가 문의를 정리하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }

  const suggestion = data as Partial<AssistantInquirySuggestion>;
  const isValidCategory = ASSISTANT_CATEGORY_OPTIONS.some(
    (option) => option.value === suggestion.category,
  );
  if (
    !isValidCategory ||
    typeof suggestion.title !== 'string' ||
    !suggestion.title.trim()
  ) {
    throw new Error('AI 추천 결과를 확인하지 못했습니다.');
  }

  return {
    category: suggestion.category as AssistantInquiryCategory,
    title: suggestion.title.trim().slice(0, 30),
  };
}

export async function createAssistantInquiry(
  input: AssistantInquiryInput,
  clientRequestId: string,
) {
  const client = requireSupabase();
  const { data, error } = await client.rpc('create_assistant_inquiry_once', {
    request_key: clientRequestId,
    inquiry_category: input.category,
    inquiry_title: maskProfanity(input.title),
    inquiry_content: maskProfanity(input.content),
  });
  if (error) throw new Error('조교 문의를 접수하지 못했습니다.');
  if (!data) throw new Error('조교 문의방을 확인하지 못했습니다.');
  const inquiryId = data as string;
  await sendPushNotificationEvent('assistant_inquiry_submitted', inquiryId);
  return inquiryId;
}

export async function getAssistantMessages(inquiryId: string): Promise<AssistantMessage[]> {
  const client = requireSupabase();
  const { data, error } = await client.from('assistant_messages')
    .select('id, inquiry_id, sender_id, content, created_at')
    .eq('inquiry_id', inquiryId).order('created_at', { ascending: true });
  if (error) throw new Error('채팅 메시지를 불러오지 못했습니다.');
  return (data ?? []) as AssistantMessage[];
}

export async function sendAssistantMessage(inquiryId: string, content: string) {
  const client = requireSupabase();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다.');
  const { data, error } = await client
    .from('assistant_messages')
    .insert({
      inquiry_id: inquiryId,
      sender_id: user.id,
      content: maskProfanity(content),
    })
    .select('id')
    .single<{ id: string }>();
  if (error || !data) throw new Error('메시지를 보내지 못했습니다.');
  await sendPushNotificationEvent('assistant_message_received', data.id);
}

export function subscribeToAssistantMessages(
  inquiryId: string,
  onMessage: (message: AssistantMessage) => void,
) {
  const client = requireSupabase();
  const channel = client.channel(`assistant-messages:${inquiryId}`).on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'assistant_messages', filter: `inquiry_id=eq.${inquiryId}` },
    (payload) => onMessage(payload.new as AssistantMessage),
  ).subscribe();
  return () => { void client.removeChannel(channel); };
}

export function subscribeToAssistantInquiryStatus(
  inquiryId: string,
  onStatusChange: (status: AssistantInquiryStatus) => void,
) {
  const client = requireSupabase();
  const channel = client
    .channel(`assistant-inquiry-status:${inquiryId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'assistant_inquiries',
        filter: `id=eq.${inquiryId}`,
      },
      (payload) => {
        const status = payload.new.status as AssistantInquiryStatus;

        if (['submitted', 'in_progress', 'answered'].includes(status)) {
          onStatusChange(status);
        }
      },
    )
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
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
) {
  const client = requireSupabase();
  const { error } = await client.rpc('transition_assistant_inquiry', {
    target_inquiry_id: id,
    new_status: status,
    reply: null,
  });
  if (error) throw new Error('조교 문의 상태를 변경하지 못했습니다.');

  if (status === 'answered') {
    const {
      data: { user },
    } = await client.auth.getUser();
    const { data: profile } = user
      ? await client
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single<{ role: string }>()
      : { data: null };

    if (profile?.role === 'admin') {
      await sendPushNotificationEvent('assistant_inquiry_answered', id);
    }
  }
}

export async function adminDeleteAssistantInquiry(id: string) {
  const { error } = await requireSupabase().rpc(
    'admin_delete_assistant_inquiry',
    { target_inquiry_id: id },
  );

  if (error) {
    throw new Error('조교 문의를 삭제하지 못했습니다.');
  }
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
