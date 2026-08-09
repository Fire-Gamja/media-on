import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { StudentHistoryList } from '../../../components/student/StudentHistoryList';
import { confirmRoomRequestNavigation } from '../../../lib/room-request-confirmation';
import { getAuthErrorMessage } from '../../../services/auth';
import {
  type RoomReservationRequest,
  type RoomReservationStatus,
  getMyRoomReservationRequests,
  getRoomStatusLabel,
} from '../../../services/room-reservations';

export default function RoomRequestsScreen() {
  const [requests, setRequests] = useState<RoomReservationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadRequests = useCallback(async (refreshing = false) => {
    refreshing ? setIsRefreshing(true) : setIsLoading(true);
    try {
      setErrorMessage(null);
      setRequests(await getMyRoomReservationRequests());
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

  const openRoomRequest = () => {
    confirmRoomRequestNavigation(() => router.push('/rooms'));
  };

  return (
    <StudentHistoryList
      actionLabel="신청"
      emptyActionLabel="실습실 둘러보기"
      emptyMessage="실습실 신청이 없습니다."
      errorMessage={errorMessage}
      errorTitle="신청 내역을 불러오지 못했습니다."
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      items={requests.map((request) => ({
        category: request.room?.location ?? '실습실 대여',
        date: `${request.reservation_date.replaceAll('-', '.')} · ${request.start_time.slice(0, 5)}~${request.end_time.slice(0, 5)}`,
        id: request.id,
        onPress: () => router.push(`/room-requests/${request.id}`),
        stage: getRequestStage(request.status),
        statusLabel: getRoomStatusLabel(request.status),
        title: request.room?.name ?? '실습실',
      }))}
      onAction={openRoomRequest}
      onBack={() => router.back()}
      onRefresh={() => void loadRequests(true)}
      onRetry={() => void loadRequests()}
      title="내 신청"
    />
  );
}

function getRequestStage(status: RoomReservationStatus) {
  if (status === 'received' || status === 'erp_checking') {
    return 'processing' as const;
  }
  if (status === 'approved' || status === 'rejected') {
    return 'completed' as const;
  }
  return 'pending' as const;
}
