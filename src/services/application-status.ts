import type { Href } from 'expo-router';

import {
  getMyAssistantInquiries,
  type AssistantInquiry,
} from './assistant-inquiries';
import {
  getEquipmentStatusLabel,
  getMyEquipmentRentalRequests,
  type EquipmentRentalRequest,
} from './equipment-rentals';
import {
  getFacilityStatusLabel,
  getMyFacilityReports,
  type FacilityReport,
} from './facility-reports';
import {
  getMyRoomReservationRequests,
  getRoomStatusLabel,
  type RoomReservationRequest,
} from './room-reservations';

export type ApplicationStage = 'pending' | 'processing' | 'completed';
export type ApplicationKind = 'equipment' | 'room' | 'facility' | 'inquiry';

export type ApplicationStatusItem = {
  id: string;
  kind: ApplicationKind;
  category: string;
  title: string;
  description: string;
  statusLabel: string;
  stage: ApplicationStage;
  createdAt: string;
  route: Href;
};

export async function getMyApplicationStatusItems() {
  const [equipment, rooms, facilities, inquiries] = await Promise.all([
    getMyEquipmentRentalRequests(),
    getMyRoomReservationRequests(),
    getMyFacilityReports(),
    getMyAssistantInquiries(),
  ]);

  return [
    ...equipment.map(toEquipmentItem),
    ...rooms.map(toRoomItem),
    ...facilities.map(toFacilityItem),
    ...inquiries.map(toInquiryItem),
  ].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() -
      new Date(left.createdAt).getTime(),
  );
}

export function getApplicationStageCounts(items: ApplicationStatusItem[]) {
  return {
    pending: items.filter((item) => item.stage === 'pending').length,
    processing: items.filter((item) => item.stage === 'processing').length,
    completed: items.filter((item) => item.stage === 'completed').length,
  };
}

function toEquipmentItem(
  request: EquipmentRentalRequest,
): ApplicationStatusItem {
  return {
    id: request.id,
    kind: 'equipment',
    category: '기자재 대여',
    title: `${request.equipment?.name ?? '기자재'} ${request.quantity}개`,
    description: `${formatDate(request.pickup_date)} ~ ${formatDate(
      request.return_date,
    )}`,
    statusLabel: getEquipmentStatusLabel(request.status),
    stage:
      request.status === 'submitted'
        ? 'pending'
        : request.status === 'returned' || request.status === 'rejected'
          ? 'completed'
          : 'processing',
    createdAt: request.created_at,
    route: `/equipment-requests/${request.id}`,
  };
}

function toRoomItem(request: RoomReservationRequest): ApplicationStatusItem {
  return {
    id: request.id,
    kind: 'room',
    category: '실습실 대여',
    title: request.room?.name ?? '실습실',
    description: `${formatDate(request.reservation_date)} · ${request.start_time.slice(
      0,
      5,
    )}~${request.end_time.slice(0, 5)}`,
    statusLabel: getRoomStatusLabel(request.status),
    stage:
      request.status === 'submitted'
        ? 'pending'
        : request.status === 'approved' || request.status === 'rejected'
          ? 'completed'
          : 'processing',
    createdAt: request.created_at,
    route: `/room-requests/${request.id}`,
  };
}

function toFacilityItem(report: FacilityReport): ApplicationStatusItem {
  return {
    id: report.id,
    kind: 'facility',
    category: '시설 신고',
    title: report.title,
    description: report.location,
    statusLabel: getFacilityStatusLabel(report.status),
    stage:
      report.status === 'submitted'
        ? 'pending'
        : report.status === 'resolved' || report.status === 'rejected'
          ? 'completed'
          : 'processing',
    createdAt: report.created_at,
    route: `/facility-reports/${report.id}`,
  };
}

function toInquiryItem(inquiry: AssistantInquiry): ApplicationStatusItem {
  return {
    id: inquiry.id,
    kind: 'inquiry',
    category: '조교 문의',
    title: inquiry.title,
    description:
      inquiry.status === 'submitted'
        ? '문의 완료'
        : inquiry.status === 'in_progress'
          ? '실시간 상담 진행 중'
          : '상담이 종료되었습니다.',
    statusLabel:
      inquiry.status === 'submitted'
        ? '문의 완료'
        : inquiry.status === 'in_progress'
          ? '상담 중'
          : '상담 완료',
    stage:
      inquiry.status === 'submitted'
        ? 'pending'
        : inquiry.status === 'answered'
          ? 'completed'
          : 'processing',
    createdAt: inquiry.created_at,
    route: `/assistant-inquiries/${inquiry.id}`,
  };
}

function formatDate(value: string) {
  return value.replaceAll('-', '.');
}
