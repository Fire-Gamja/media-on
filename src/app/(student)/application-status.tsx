import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';

import {
  type HistoryStage,
  StudentHistoryList,
} from '../../components/student/StudentHistoryList';
import {
  type ApplicationStatusItem,
  getMyApplicationStatusItems,
} from '../../services/application-status';
import { getAuthErrorMessage } from '../../services/auth';

export default function ApplicationStatusScreen() {
  const { stage: rawStage } = useLocalSearchParams<{ stage?: string }>();
  const [items, setItems] = useState<ApplicationStatusItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadItems = useCallback(async (refreshing = false) => {
    refreshing ? setIsRefreshing(true) : setIsLoading(true);
    try {
      setErrorMessage(null);
      setItems(await getMyApplicationStatusItems());
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadItems();
    }, [loadItems]),
  );

  return (
    <StudentHistoryList
      emptyMessage="신청이 없습니다."
      errorMessage={errorMessage}
      errorTitle="신청 현황을 불러오지 못했습니다."
      initialStage={isHistoryStage(rawStage) ? rawStage : 'pending'}
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      items={items.map((item) => ({
        category: item.category,
        date: formatDate(item.createdAt),
        id: `${item.kind}-${item.id}`,
        onPress: () => router.push(item.route),
        stage: item.stage,
        statusLabel: item.statusLabel,
        title: item.title,
      }))}
      onBack={() => router.back()}
      onRefresh={() => void loadItems(true)}
      onRetry={() => void loadItems()}
      title="내 신청 현황"
    />
  );
}

function isHistoryStage(value?: string): value is HistoryStage {
  return value === 'pending' || value === 'processing' || value === 'completed';
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10).replaceAll('-', '.');
  }
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(date)
    .replace(/\s/g, '');
}
