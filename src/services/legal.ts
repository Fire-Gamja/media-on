import {
  AI_TRANSFER_VERSION,
  PRIVACY_VERSION,
  TERMS_VERSION,
} from '../content/legal';
import { supabase } from '../lib/supabase';

export type RequiredLegalAcceptanceStatus = {
  accepted: boolean;
  privacyConfirmed: boolean;
  termsAccepted: boolean;
};

type LegalAcceptanceRow = {
  document_key: string;
  document_version: string;
};

const requireSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase 프로젝트 정보가 설정되지 않았습니다.');
  }

  return supabase;
};

export async function getRequiredLegalAcceptanceStatus(): Promise<RequiredLegalAcceptanceStatus> {
  const client = requireSupabase();
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError || !user) {
    throw new Error('로그인 정보를 확인할 수 없습니다.');
  }

  const { data, error } = await client
    .from('legal_acceptances')
    .select('document_key, document_version')
    .eq('user_id', user.id)
    .in('document_key', ['terms', 'privacy']);

  if (error) {
    throw new Error('약관 확인 상태를 불러오지 못했습니다.');
  }

  const rows = (data ?? []) as LegalAcceptanceRow[];
  const termsAccepted = rows.some(
    (row) =>
      row.document_key === 'terms' && row.document_version === TERMS_VERSION,
  );
  const privacyConfirmed = rows.some(
    (row) =>
      row.document_key === 'privacy' &&
      row.document_version === PRIVACY_VERSION,
  );

  return {
    accepted: termsAccepted && privacyConfirmed,
    privacyConfirmed,
    termsAccepted,
  };
}
export async function acceptRequiredLegalDocuments() {
  const { error } = await requireSupabase().rpc(
    'accept_required_legal_documents',
  );

  if (error) {
    throw new Error('약관 동의 기록을 저장하지 못했습니다.');
  }
}

export async function acceptAiTransfer() {
  const { error } = await requireSupabase().rpc('accept_ai_transfer', {
    expected_version: AI_TRANSFER_VERSION,
  });

  if (error) {
    throw new Error('AI 기능 동의 기록을 저장하지 못했습니다.');
  }
}

export async function deleteCurrentAccount() {
  const client = requireSupabase();
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError || !user) {
    throw new Error('로그인 정보를 확인할 수 없습니다.');
  }

  const avatarPath = `${user.id}/avatar.jpg`;
  const { error: storageError } = await client.storage
    .from('profile-images')
    .remove([avatarPath]);

  if (storageError) {
    console.warn('프로필 사진 삭제를 완료하지 못했습니다.', storageError);
  }

  const { error } = await client.rpc('delete_my_account');
  if (error) {
    throw new Error('계정과 연결 데이터를 삭제하지 못했습니다.');
  }

  await client.auth.signOut({ scope: 'local' });
}
