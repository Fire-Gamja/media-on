import { supabase } from '../lib/supabase';

export type Notice = {
  id: string;
  title: string;
  content: string;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type NoticeInput = {
  title: string;
  content: string;
  isPublished: boolean;
};

const requireSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase 프로젝트 정보가 설정되지 않았습니다.');
  }

  return supabase;
};

const noticeColumns =
  'id, title, content, is_published, published_at, created_at, updated_at';

export async function getPublishedNotices(limit?: number): Promise<Notice[]> {
  const client = requireSupabase();
  let query = client
    .from('notices')
    .select(noticeColumns)
    .eq('is_published', true)
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

export async function getAdminNotices(): Promise<Notice[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('notices')
    .select(noticeColumns)
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
  const { error } = await client.from('notices').insert({
    title: input.title.trim(),
    content: input.content.trim(),
    is_published: input.isPublished,
    published_at: input.isPublished ? new Date().toISOString() : null,
  });

  if (error) {
    throw new Error('공지사항을 저장하지 못했습니다.');
  }
}

export async function updateNotice(id: string, input: NoticeInput) {
  const client = requireSupabase();
  const { error } = await client
    .from('notices')
    .update({
      title: input.title.trim(),
      content: input.content.trim(),
      is_published: input.isPublished,
      published_at: input.isPublished ? new Date().toISOString() : null,
    })
    .eq('id', id);

  if (error) {
    throw new Error('공지사항을 수정하지 못했습니다.');
  }
}

export async function deleteNotice(id: string) {
  const client = requireSupabase();
  const { error } = await client.from('notices').delete().eq('id', id);

  if (error) {
    throw new Error('공지사항을 삭제하지 못했습니다.');
  }
}
