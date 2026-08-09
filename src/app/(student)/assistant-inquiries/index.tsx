import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { StudentHistoryList } from '../../../components/student/StudentHistoryList';
import { getAuthErrorMessage } from '../../../services/auth';
import {
  type AssistantInquiry,
  type AssistantInquiryStatus,
  getAssistantCategoryLabel,
  getAssistantStatusLabel,
  getMyAssistantInquiries,
} from '../../../services/assistant-inquiries';

export default function AssistantInquiriesScreen() {
  const [inquiries, setInquiries] = useState<AssistantInquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadInquiries = useCallback(async (refreshing = false) => {
    refreshing ? setIsRefreshing(true) : setIsLoading(true);
    try {
      setErrorMessage(null);
      setInquiries(await getMyAssistantInquiries());
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadInquiries();
    }, [loadInquiries]),
  );

  return (
    <StudentHistoryList
      actionLabel="문의"
      emptyActionLabel="조교에게 문의하기"
      emptyMessage="문의가 없습니다."
      errorMessage={errorMessage}
      errorTitle="문의 내역을 불러오지 못했습니다."
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      items={inquiries.map((inquiry) => ({
        category: getAssistantCategoryLabel(inquiry.category),
        date: formatDate(inquiry.created_at),
        id: inquiry.id,
        onPress: () => router.push(`/assistant-inquiries/${inquiry.id}`),
        stage: getInquiryStage(inquiry.status),
        statusLabel: getAssistantStatusLabel(inquiry.status),
        title: inquiry.title,
      }))}
      onAction={() => router.push('/assistant-inquiry')}
      onBack={() => router.back()}
      onRefresh={() => void loadInquiries(true)}
      onRetry={() => void loadInquiries()}
      title="내 문의"
    />
  );
}

function getInquiryStage(status: AssistantInquiryStatus) {
  if (status === 'in_progress') return 'processing' as const;
  if (status === 'answered') return 'completed' as const;
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
