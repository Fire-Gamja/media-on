import { supabase } from '../lib/supabase';
import { sendPushNotificationEvent } from './push-notifications';

export type Notice = {
  id: string;
  title: string;
  content: string;
  is_published: boolean;
  is_urgent: boolean;
  is_pinned: boolean;
  expires_at: string | null;
  attachments: NoticeAttachment[];
  urgent_resend_count: number;
  last_urgent_resent_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type NoticeAttachment = {
  path: string;
  name: string;
  mimeType: string;
  size: number;
  kind: 'image' | 'file';
};

export type NoticeInput = {
  title: string;
  content: string;
  isPublished: boolean;
  isUrgent: boolean;
  isPinned?: boolean;
  expiresAt?: string | null;
};

const requireSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase 프로젝트 정보가 설정되지 않았습니다.');
  }

  return supabase;
};

const noticeColumns =
  'id, title, content, is_published, is_urgent, is_pinned, expires_at, attachments, urgent_resend_count, last_urgent_resent_at, published_at, created_at, updated_at';
const noticeAttachmentsBucket = 'notice-attachments';

export function formatNoticeTitle(title: string, isUrgent: boolean) {
  const titleWithoutUrgentLabel = title
    .trim()
    .replace(/^\[긴급\]\s*/u, '');

  return isUrgent
    ? `[긴급] ${titleWithoutUrgentLabel}`
    : titleWithoutUrgentLabel;
}

export async function getPublishedNotices(limit?: number): Promise<Notice[]> {
  const client = requireSupabase();
  let query = client
    .from('notices')
    .select(noticeColumns)
    .eq('is_published', true)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('is_pinned', { ascending: false })
    .order('is_urgent', { ascending: false })
    .order('published_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error('공지사항을 불러오지 못했습니다.');
  }

  return (data ?? []) as Notice[];
}

export async function getPublishedNotice(id: string): Promise<Notice> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('notices')
    .select(noticeColumns)
    .eq('id', id)
    .eq('is_published', true)
    .single();

  if (error || !data) {
    throw new Error('공지사항을 찾을 수 없습니다.');
  }

  return data as Notice;
}

export async function getNoticeAttachmentUrls(
  attachments: NoticeAttachment[],
): Promise<Record<string, string>> {
  if (attachments.length === 0) {
    return {};
  }

  const client = requireSupabase();
  const { data, error } = await client.storage
    .from(noticeAttachmentsBucket)
    .createSignedUrls(
      attachments.map((attachment) => attachment.path),
      60 * 60,
    );

  if (error) {
    throw new Error('공지 첨부파일을 불러오지 못했습니다.');
  }

  return Object.fromEntries(
    (data ?? [])
      .filter((item) => item.signedUrl)
      .map((item) => [item.path, item.signedUrl]),
  );
}

export async function getAdminNotices(): Promise<Notice[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('notices')
    .select(noticeColumns)
    .order('is_pinned', { ascending: false })
    .order('is_urgent', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('공지사항 관리 목록을 불러오지 못했습니다.');
  }

  return (data ?? []) as Notice[];
}

export async function getAdminNotice(id: string): Promise<Notice> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('notices')
    .select(noticeColumns)
    .eq('id', id)
    .single();

  if (error || !data) {
    throw new Error('공지사항을 찾을 수 없습니다.');
  }

  return data as Notice;
}

export async function createNotice(input: NoticeInput) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('notices')
    .insert({
      title: formatNoticeTitle(input.title, false),
      content: input.content.trim(),
      is_published: input.isPublished,
      is_urgent: input.isUrgent,
      ...(input.isPinned === undefined ? {} : { is_pinned: input.isPinned }),
      ...(input.expiresAt === undefined ? {} : { expires_at: input.expiresAt }),
      published_at: input.isPublished ? new Date().toISOString() : null,
    })
    .select('id')
    .single<{ id: string }>();

  if (error || !data) {
    throw new Error('공지사항을 저장하지 못했습니다.');
  }

  if (input.isPublished) {
    await sendPushNotificationEvent('notice_published', data.id);
  }
}

export async function updateNotice(id: string, input: NoticeInput) {
  const client = requireSupabase();
  const { data: currentNotice, error: currentNoticeError } = await client
    .from('notices')
    .select('is_published, published_at')
    .eq('id', id)
    .single<Pick<Notice, 'is_published' | 'published_at'>>();

  if (currentNoticeError || !currentNotice) {
    throw new Error('공지사항을 찾을 수 없습니다.');
  }

  const isNewlyPublished = input.isPublished && !currentNotice.is_published;
  const { error } = await client
    .from('notices')
    .update({
      title: formatNoticeTitle(input.title, false),
      content: input.content.trim(),
      is_published: input.isPublished,
      is_urgent: input.isUrgent,
      ...(input.isPinned === undefined ? {} : { is_pinned: input.isPinned }),
      ...(input.expiresAt === undefined ? {} : { expires_at: input.expiresAt }),
      published_at: input.isPublished
        ? (currentNotice.published_at ?? new Date().toISOString())
        : null,
    })
    .eq('id', id);

  if (error) {
    throw new Error('공지사항을 수정하지 못했습니다.');
  }

  if (isNewlyPublished) {
    await sendPushNotificationEvent('notice_published', id);
  }
}

export async function deleteNotice(id: string) {
  const client = requireSupabase();
  const { error } = await client.from('notices').delete().eq('id', id);

  if (error) {
    throw new Error('공지사항을 삭제하지 못했습니다.');
  }
}

export async function resendUrgentNotices() {
  const client = requireSupabase();
  const { data, error } = await client
    .from('notices')
    .select('id, urgent_resend_count')
    .eq('is_published', true)
    .eq('is_urgent', true)
    .order('published_at', { ascending: false });

  if (error) {
    throw new Error('긴급 공지 목록을 불러오지 못했습니다.');
  }

  const notices =
    (data ?? []) as Pick<Notice, 'id' | 'urgent_resend_count'>[];

  if (notices.length === 0) {
    return { total: 0, sent: 0 };
  }

  let sent = 0;

  for (const notice of notices) {
    const wasSent = await sendPushNotificationEvent(
      'notice_published',
      notice.id,
    );

    if (!wasSent) continue;

    sent += 1;
    await client
      .from('notices')
      .update({
        urgent_resend_count: notice.urgent_resend_count + 1,
        last_urgent_resent_at: new Date().toISOString(),
      })
      .eq('id', notice.id);
  }

  return { total: notices.length, sent };
}
