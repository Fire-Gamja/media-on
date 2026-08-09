import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { StudentHistoryList } from '../../../components/student/StudentHistoryList';
import { getAuthErrorMessage } from '../../../services/auth';
import {
  type EquipmentRentalRequest,
  type EquipmentRequestStatus,
  getEquipmentStatusLabel,
  getMyEquipmentRentalRequests,
} from '../../../services/equipment-rentals';

export default function EquipmentRequestsScreen() {
  const [requests, setRequests] = useState<EquipmentRentalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadRequests = useCallback(async (refreshing = false) => {
    refreshing ? setIsRefreshing(true) : setIsLoading(true);
    try {
      setErrorMessage(null);
      setRequests(await getMyEquipmentRentalRequests());
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadRequests();
    }, [loadRequests]),
  );

  return (
    <StudentHistoryList
      actionLabel="신청"
      emptyActionLabel="기자재 둘러보기"
      emptyMessage="대여 신청이 없습니다."
      errorMessage={errorMessage}
      errorTitle="신청 내역을 불러오지 못했습니다."
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      items={requests.map((request) => ({
        category: request.equipment?.category ?? '기자재 대여',
        date: `${formatDate(request.pickup_date)} ~ ${formatDate(request.return_date)}`,
        id: request.id,
        onPress: () => router.push(`/equipment-requests/${request.id}`),
        stage: getRequestStage(request.status),
        statusLabel: getEquipmentStatusLabel(request.status),
        title: `${request.equipment?.name ?? '기자재'} ${request.quantity}개`,
      }))}
      onAction={() => router.push('/equipment')}
      onBack={() => router.back()}
      onRefresh={() => void loadRequests(true)}
      onRetry={() => void loadRequests()}
      title="내 신청"
    />
  );
}

function getRequestStage(status: EquipmentRequestStatus) {
  if (status === 'approved' || status === 'checked_out') {
    return 'processing' as const;
  }
  if (status === 'returned' || status === 'rejected') {
    return 'completed' as const;
  }
  return 'pending' as const;
}

function formatDate(value: string) {
  return value.replaceAll('-', '.');
}
