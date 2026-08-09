import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { StudentHistoryList } from '../../../components/student/StudentHistoryList';
import { getAuthErrorMessage } from '../../../services/auth';
import {
  type FacilityReport,
  type FacilityReportStatus,
  getFacilityCategoryLabel,
  getFacilityStatusLabel,
  getMyFacilityReports,
} from '../../../services/facility-reports';

export default function FacilityReportsScreen() {
  const [reports, setReports] = useState<FacilityReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadReports = useCallback(async (refreshing = false) => {
    refreshing ? setIsRefreshing(true) : setIsLoading(true);
    try {
      setErrorMessage(null);
      setReports(await getMyFacilityReports());
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadReports();
    }, [loadReports]),
  );

  return (
    <StudentHistoryList
      actionLabel="신고"
      emptyActionLabel="시설 신고하기"
      emptyMessage="신고가 없습니다."
      errorMessage={errorMessage}
      errorTitle="신고 내역을 불러오지 못했습니다."
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      items={reports.map((report) => ({
        category: `${getFacilityCategoryLabel(report.category)} · ${report.location}`,
        date: formatDate(report.created_at),
        id: report.id,
        onPress: () => router.push(`/facility-reports/${report.id}`),
        stage: getReportStage(report.status),
        statusLabel: getFacilityStatusLabel(report.status),
        title: report.title,
      }))}
      onAction={() => router.push('/facility-report')}
      onBack={() => router.back()}
      onRefresh={() => void loadReports(true)}
      onRetry={() => void loadReports()}
      title="내 신고"
    />
  );
}

function getReportStage(status: FacilityReportStatus) {
  if (status === 'received' || status === 'in_progress') {
    return 'processing' as const;
  }
  if (status === 'resolved' || status === 'rejected') {
    return 'completed' as const;
  }
  return 'pending' as const;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date(value))
    .replace(/\s/g, '');
}
