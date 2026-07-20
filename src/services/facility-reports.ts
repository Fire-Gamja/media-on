import { supabase } from '../lib/supabase';

export type FacilityIssueCategory =
  | 'network'
  | 'computer'
  | 'projector'
  | 'furniture'
  | 'electricity'
  | 'other';

export type FacilityReportStatus =
  | 'received'
  | 'in_progress'
  | 'resolved'
  | 'rejected';

export type FacilityReport = {
  id: string;
  reporter_id: string;
  location: string;
  category: FacilityIssueCategory;
  title: string;
  description: string;
  status: FacilityReportStatus;
  admin_note: string | null;
  reviewed_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminFacilityReport = FacilityReport & {
  reporter: ReporterProfile | null;
};

type ReporterProfile = {
  name: string;
  student_number: string;
};

type AdminFacilityReportRow = FacilityReport & {
  reporter: ReporterProfile | ReporterProfile[] | null;
};

export type FacilityReportInput = {
  location: string;
  category: FacilityIssueCategory;
  title: string;
  description: string;
};

export const FACILITY_CATEGORY_OPTIONS: ReadonlyArray<{
  value: FacilityIssueCategory;
  label: string;
}> = [
  { value: 'network', label: '인터넷·네트워크' },
  { value: 'computer', label: '컴퓨터·주변기기' },
  { value: 'projector', label: '빔프로젝터·화면' },
  { value: 'furniture', label: '책상·의자·가구' },
  { value: 'electricity', label: '전기·조명' },
  { value: 'other', label: '기타' },
];

export const FACILITY_STATUS_OPTIONS: ReadonlyArray<{
  value: FacilityReportStatus;
  label: string;
}> = [
  { value: 'received', label: '접수 완료' },
  { value: 'in_progress', label: '처리 중' },
  { value: 'resolved', label: '처리 완료' },
  { value: 'rejected', label: '반려' },
];

const facilityReportColumns =
  'id, reporter_id, location, category, title, description, status, admin_note, reviewed_by, resolved_at, created_at, updated_at';

const requireSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase 프로젝트 정보가 설정되지 않았습니다.');
  }

  return supabase;
};

export function getFacilityCategoryLabel(category: FacilityIssueCategory) {
  return (
    FACILITY_CATEGORY_OPTIONS.find((option) => option.value === category)
      ?.label ?? '기타'
  );
}

export function getFacilityStatusLabel(status: FacilityReportStatus) {
  return (
    FACILITY_STATUS_OPTIONS.find((option) => option.value === status)?.label ??
    '접수 완료'
  );
}

export async function createFacilityReport(input: FacilityReportInput) {
  const client = requireSupabase();
  const { error } = await client.from('facility_reports').insert({
    location: input.location.trim(),
    category: input.category,
    title: input.title.trim(),
    description: input.description.trim(),
  });

  if (error) {
    throw new Error('시설 신고를 접수하지 못했습니다.');
  }
}

export async function getMyFacilityReports(
  limit?: number,
): Promise<FacilityReport[]> {
  const client = requireSupabase();
  let query = client
    .from('facility_reports')
    .select(facilityReportColumns)
    .order('created_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error('내 시설 신고 내역을 불러오지 못했습니다.');
  }

  return (data ?? []) as FacilityReport[];
}

export async function getMyFacilityReport(id: string): Promise<FacilityReport> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('facility_reports')
    .select(facilityReportColumns)
    .eq('id', id)
    .single();

  if (error || !data) {
    throw new Error('시설 신고 내역을 찾을 수 없습니다.');
  }

  return data as FacilityReport;
}

export async function getAdminFacilityReports(): Promise<
  AdminFacilityReport[]
> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('facility_reports')
    .select(
      `${facilityReportColumns}, reporter:profiles!facility_reports_reporter_id_fkey(name, student_number)`,
    )
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('시설 신고 관리 목록을 불러오지 못했습니다.');
  }

  return ((data ?? []) as unknown as AdminFacilityReportRow[]).map(
    normalizeAdminFacilityReport,
  );
}

export async function getAdminFacilityReport(
  id: string,
): Promise<AdminFacilityReport> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('facility_reports')
    .select(
      `${facilityReportColumns}, reporter:profiles!facility_reports_reporter_id_fkey(name, student_number)`,
    )
    .eq('id', id)
    .single();

  if (error || !data) {
    throw new Error('시설 신고를 찾을 수 없습니다.');
  }

  return normalizeAdminFacilityReport(
    data as unknown as AdminFacilityReportRow,
  );
}

function normalizeAdminFacilityReport(
  report: AdminFacilityReportRow,
): AdminFacilityReport {
  return {
    ...report,
    reporter: Array.isArray(report.reporter)
      ? (report.reporter[0] ?? null)
      : report.reporter,
  };
}

export async function updateFacilityReportStatus(
  id: string,
  status: FacilityReportStatus,
  adminNote: string,
) {
  const client = requireSupabase();
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError || !user) {
    throw new Error('관리자 로그인 정보를 확인할 수 없습니다.');
  }

  const { error } = await client
    .from('facility_reports')
    .update({
      status,
      admin_note: adminNote.trim() || null,
      reviewed_by: user.id,
      resolved_at: status === 'resolved' ? new Date().toISOString() : null,
    })
    .eq('id', id);

  if (error) {
    throw new Error('시설 신고 처리 상태를 저장하지 못했습니다.');
  }
}
