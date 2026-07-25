declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

type PushNotificationEvent =
  | 'assistant_inquiry_answered'
  | 'equipment_request_status'
  | 'facility_report_status'
  | 'notice_published'
  | 'room_request_status';

type PushTarget = {
  recipientIds: string[];
  title: string;
  body: string;
  url: string;
};

type PushDevice = {
  id: string;
  user_id: string;
  expo_push_token: string;
};

type ExpoPushTicket = {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: {
    error?: string;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const eventTypes: PushNotificationEvent[] = [
  'assistant_inquiry_answered',
  'equipment_request_status',
  'facility_report_status',
  'notice_published',
  'room_request_status',
];

const equipmentStatusLabels: Record<string, string> = {
  submitted: '신청 완료',
  approved: '승인 완료',
  checked_out: '대여 중',
  returned: '반납 완료',
  rejected: '반려',
};

const facilityStatusLabels: Record<string, string> = {
  submitted: '신청 완료',
  received: '접수 완료',
  in_progress: '조치 중',
  resolved: '조치 완료',
  rejected: '반려',
};

const roomStatusLabels: Record<string, string> = {
  submitted: '신청 완료',
  received: '접수 완료',
  erp_checking: 'ERP 확인 중',
  approved: '승인 완료',
  rejected: '반려',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization) {
      return json({ error: '로그인이 필요합니다.' }, 401);
    }

    const supabaseUrl = requireEnvironmentValue('SUPABASE_URL');
    const publishableKey = readDefaultKey(
      'SUPABASE_PUBLISHABLE_KEYS',
      'SUPABASE_ANON_KEY',
    );
    const secretKey = readDefaultKey(
      'SUPABASE_SECRET_KEYS',
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    if (!publishableKey || !secretKey) {
      throw new Error('Supabase API keys are missing.');
    }

    const callerId = await getCallerId(
      supabaseUrl,
      publishableKey,
      authorization,
    );
    const adminHeaders = createAdminHeaders(secretKey);
    const [callerProfile] = await adminSelect<{
      role: string;
      approval_status: string;
    }>(supabaseUrl, adminHeaders, 'profiles', {
      select: 'role,approval_status',
      id: `eq.${callerId}`,
      limit: '1',
    });

    if (
      callerProfile?.role !== 'admin' ||
      callerProfile.approval_status !== 'approved'
    ) {
      return json({ error: '관리자 권한이 필요합니다.' }, 403);
    }

    const payload = (await request.json()) as {
      event?: unknown;
      resourceId?: unknown;
    };

    if (
      typeof payload.event !== 'string' ||
      !eventTypes.includes(payload.event as PushNotificationEvent) ||
      typeof payload.resourceId !== 'string' ||
      !isUuid(payload.resourceId)
    ) {
      return json({ error: '알림 요청 형식이 올바르지 않습니다.' }, 400);
    }

    const target = await resolvePushTarget(
      supabaseUrl,
      adminHeaders,
      payload.event as PushNotificationEvent,
      payload.resourceId,
    );

    if (target.recipientIds.length === 0) {
      return json({ sent: 0, failed: 0, skipped: 0 });
    }

    const activeDevices = await adminSelect<PushDevice>(
      supabaseUrl,
      adminHeaders,
      'push_devices',
      {
        select: 'id,user_id,expo_push_token',
        is_active: 'eq.true',
      },
    );
    const recipientSet = new Set(target.recipientIds);
    const devices = activeDevices.filter((device) =>
      recipientSet.has(device.user_id),
    );

    if (devices.length === 0) {
      return json({ sent: 0, failed: 0, skipped: target.recipientIds.length });
    }

    const result = await sendExpoPushNotifications(
      supabaseUrl,
      adminHeaders,
      devices,
      target,
    );

    return json(result);
  } catch (error) {
    console.error(error);
    return json({ error: '푸시 알림 처리 중 오류가 발생했습니다.' }, 500);
  }
});

async function resolvePushTarget(
  supabaseUrl: string,
  adminHeaders: Record<string, string>,
  event: PushNotificationEvent,
  resourceId: string,
): Promise<PushTarget> {
  if (event === 'notice_published') {
    const [notice] = await adminSelect<{
      id: string;
      title: string;
      is_published: boolean;
    }>(supabaseUrl, adminHeaders, 'notices', {
      select: 'id,title,is_published',
      id: `eq.${resourceId}`,
      limit: '1',
    });

    if (!notice?.is_published) {
      throw new Error('The notice is not published.');
    }

    const students = await adminSelect<{ id: string }>(
      supabaseUrl,
      adminHeaders,
      'profiles',
      {
        select: 'id',
        role: 'eq.student',
        approval_status: 'eq.approved',
      },
    );

    return {
      recipientIds: students.map(({ id }) => id),
      title: '새 공지사항',
      body: notice.title,
      url: `/notices/${notice.id}`,
    };
  }

  if (event === 'assistant_inquiry_answered') {
    const [inquiry] = await adminSelect<{
      id: string;
      requester_id: string;
      status: string;
      title: string;
    }>(supabaseUrl, adminHeaders, 'assistant_inquiries', {
      select: 'id,requester_id,status,title',
      id: `eq.${resourceId}`,
      limit: '1',
    });

    if (!inquiry || inquiry.status !== 'answered') {
      throw new Error('The inquiry is not answered.');
    }

    return {
      recipientIds: [inquiry.requester_id],
      title: '조교 문의 답변 완료',
      body: `${inquiry.title} 문의에 답변이 등록되었습니다.`,
      url: `/assistant-inquiries/${inquiry.id}`,
    };
  }

  if (event === 'equipment_request_status') {
    const [rentalRequest] = await adminSelect<{
      id: string;
      requester_id: string;
      status: string;
    }>(supabaseUrl, adminHeaders, 'equipment_rental_requests', {
      select: 'id,requester_id,status',
      id: `eq.${resourceId}`,
      limit: '1',
    });

    if (!rentalRequest) {
      throw new Error('The equipment request does not exist.');
    }

    return {
      recipientIds: [rentalRequest.requester_id],
      title: '기자재 대여 상태 변경',
      body: `신청 상태가 ${getStatusLabel(
        equipmentStatusLabels,
        rentalRequest.status,
      )}(으)로 변경되었습니다.`,
      url: `/equipment-requests/${rentalRequest.id}`,
    };
  }

  if (event === 'facility_report_status') {
    const [report] = await adminSelect<{
      id: string;
      reporter_id: string;
      status: string;
      title: string;
    }>(supabaseUrl, adminHeaders, 'facility_reports', {
      select: 'id,reporter_id,status,title',
      id: `eq.${resourceId}`,
      limit: '1',
    });

    if (!report) {
      throw new Error('The facility report does not exist.');
    }

    return {
      recipientIds: [report.reporter_id],
      title: '시설 신고 상태 변경',
      body: `${report.title} 신고가 ${getStatusLabel(
        facilityStatusLabels,
        report.status,
      )} 상태로 변경되었습니다.`,
      url: `/facility-reports/${report.id}`,
    };
  }

  const [roomRequest] = await adminSelect<{
    id: string;
    requester_id: string;
    status: string;
  }>(supabaseUrl, adminHeaders, 'room_reservation_requests', {
    select: 'id,requester_id,status',
    id: `eq.${resourceId}`,
    limit: '1',
  });

  if (!roomRequest) {
    throw new Error('The room request does not exist.');
  }

  return {
    recipientIds: [roomRequest.requester_id],
    title: '실습실 대여 상태 변경',
    body: `신청 상태가 ${getStatusLabel(
      roomStatusLabels,
      roomRequest.status,
    )}(으)로 변경되었습니다.`,
    url: `/room-requests/${roomRequest.id}`,
  };
}

async function sendExpoPushNotifications(
  supabaseUrl: string,
  adminHeaders: Record<string, string>,
  devices: PushDevice[],
  target: PushTarget,
) {
  let sent = 0;
  let failed = 0;
  const expoAccessToken = Deno.env.get('EXPO_ACCESS_TOKEN');

  for (let index = 0; index < devices.length; index += 100) {
    const deviceChunk = devices.slice(index, index + 100);
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(expoAccessToken
          ? { Authorization: `Bearer ${expoAccessToken}` }
          : {}),
      },
      body: JSON.stringify(
        deviceChunk.map((device) => ({
          to: device.expo_push_token,
          sound: 'default',
          title: target.title,
          body: target.body,
          data: { url: target.url },
          priority: 'high',
          channelId: 'media-on',
        })),
      ),
    });

    if (!response.ok) {
      throw new Error(`Expo push request failed with ${response.status}.`);
    }

    const payload = (await response.json()) as {
      data?: ExpoPushTicket[];
    };
    const tickets = Array.isArray(payload.data) ? payload.data : [];

    for (let ticketIndex = 0; ticketIndex < deviceChunk.length; ticketIndex++) {
      const ticket = tickets[ticketIndex];
      const device = deviceChunk[ticketIndex];

      if (ticket?.status === 'ok') {
        sent += 1;
        continue;
      }

      failed += 1;

      if (ticket?.details?.error === 'DeviceNotRegistered') {
        await adminUpdate(
          supabaseUrl,
          adminHeaders,
          'push_devices',
          { id: `eq.${device.id}` },
          { is_active: false },
        );
      }
    }
  }

  return { sent, failed, skipped: 0 };
}

async function getCallerId(
  supabaseUrl: string,
  publishableKey: string,
  authorization: string,
) {
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: publishableKey,
      Authorization: authorization,
    },
  });

  if (!response.ok) {
    throw new Error('The caller session is invalid.');
  }

  const user = (await response.json()) as { id?: string };
  if (!user.id) {
    throw new Error('The caller user could not be identified.');
  }

  return user.id;
}

async function adminSelect<T>(
  supabaseUrl: string,
  adminHeaders: Record<string, string>,
  table: string,
  query: Record<string, string>,
): Promise<T[]> {
  const url = new URL(`${supabaseUrl}/rest/v1/${table}`);
  Object.entries(query).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url, {
    headers: adminHeaders,
  });

  if (!response.ok) {
    throw new Error(`Supabase select failed for ${table}.`);
  }

  return (await response.json()) as T[];
}

async function adminUpdate(
  supabaseUrl: string,
  adminHeaders: Record<string, string>,
  table: string,
  query: Record<string, string>,
  body: Record<string, unknown>,
) {
  const url = new URL(`${supabaseUrl}/rest/v1/${table}`);
  Object.entries(query).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      ...adminHeaders,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Supabase update failed for ${table}.`);
  }
}

function createAdminHeaders(secretKey: string) {
  return {
    apikey: secretKey,
    'Content-Type': 'application/json',
    ...(secretKey.startsWith('eyJ')
      ? { Authorization: `Bearer ${secretKey}` }
      : {}),
  };
}

function readDefaultKey(jsonName: string, legacyName: string) {
  const jsonValue = Deno.env.get(jsonName);

  if (jsonValue) {
    try {
      const keys = JSON.parse(jsonValue) as Record<string, string>;
      if (keys.default) {
        return keys.default;
      }
    } catch {
      throw new Error(`${jsonName} is not valid JSON.`);
    }
  }

  return Deno.env.get(legacyName);
}

function requireEnvironmentValue(name: string) {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`${name} is missing.`);
  }
  return value;
}

function getStatusLabel(labels: Record<string, string>, status: string) {
  return labels[status] ?? status;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}
