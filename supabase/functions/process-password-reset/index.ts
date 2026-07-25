declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

type ResetAction = 'issue' | 'reject';

type ResetRequest = {
  id: string;
  requester_id: string;
  status: 'submitted' | 'completed' | 'rejected';
};

type AuthUser = {
  id?: string;
  user_metadata?: Record<string, unknown>;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
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
      requestId?: unknown;
      action?: unknown;
      note?: unknown;
    };

    if (
      typeof payload.requestId !== 'string' ||
      !isUuid(payload.requestId) ||
      (payload.action !== 'issue' && payload.action !== 'reject') ||
      (payload.note !== undefined && typeof payload.note !== 'string')
    ) {
      return json({ error: '요청 형식이 올바르지 않습니다.' }, 400);
    }

    const action = payload.action as ResetAction;
    const note =
      typeof payload.note === 'string'
        ? payload.note.trim().slice(0, 500)
        : null;
    const [resetRequest] = await adminSelect<ResetRequest>(
      supabaseUrl,
      adminHeaders,
      'password_reset_requests',
      {
        select: 'id,requester_id,status',
        id: `eq.${payload.requestId}`,
        limit: '1',
      },
    );

    if (!resetRequest) {
      return json({ error: '재설정 요청을 찾을 수 없습니다.' }, 404);
    }

    if (resetRequest.status !== 'submitted') {
      return json({ error: '이미 처리된 재설정 요청입니다.' }, 409);
    }

    if (action === 'reject') {
      await adminUpdate(
        supabaseUrl,
        adminHeaders,
        'password_reset_requests',
        { id: `eq.${resetRequest.id}`, status: 'eq.submitted' },
        {
          status: 'rejected',
          admin_note: note || '등록 정보 확인이 필요합니다.',
          reviewed_by: callerId,
          reviewed_at: new Date().toISOString(),
        },
      );

      return json({ status: 'rejected' });
    }

    const authUser = await getAdminAuthUser(
      supabaseUrl,
      secretKey,
      resetRequest.requester_id,
    );
    const temporaryPassword = createTemporaryPassword();

    await updateAdminAuthUser(
      supabaseUrl,
      secretKey,
      resetRequest.requester_id,
      temporaryPassword,
      {
        ...(authUser.user_metadata ?? {}),
        must_change_password: true,
      },
    );
    await adminUpdate(
      supabaseUrl,
      adminHeaders,
      'password_reset_requests',
      { id: `eq.${resetRequest.id}`, status: 'eq.submitted' },
      {
        status: 'completed',
        admin_note: note,
        reviewed_by: callerId,
        reviewed_at: new Date().toISOString(),
      },
    );

    return json({
      status: 'completed',
      temporaryPassword,
    });
  } catch (error) {
    console.error(error);
    return json(
      { error: '비밀번호 재설정 처리 중 오류가 발생했습니다.' },
      500,
    );
  }
});

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

  const user = (await response.json()) as AuthUser;
  if (!user.id) {
    throw new Error('The caller user could not be identified.');
  }

  return user.id;
}

async function getAdminAuthUser(
  supabaseUrl: string,
  secretKey: string,
  userId: string,
): Promise<AuthUser> {
  const response = await fetch(
    `${supabaseUrl}/auth/v1/admin/users/${userId}`,
    {
      headers: createAuthAdminHeaders(secretKey),
    },
  );

  if (!response.ok) {
    throw new Error('The requested auth user could not be loaded.');
  }

  return (await response.json()) as AuthUser;
}

async function updateAdminAuthUser(
  supabaseUrl: string,
  secretKey: string,
  userId: string,
  password: string,
  userMetadata: Record<string, unknown>,
) {
  const response = await fetch(
    `${supabaseUrl}/auth/v1/admin/users/${userId}`,
    {
      method: 'PUT',
      headers: createAuthAdminHeaders(secretKey),
      body: JSON.stringify({
        password,
        user_metadata: userMetadata,
      }),
    },
  );

  if (!response.ok) {
    throw new Error('The auth user password could not be updated.');
  }
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

  const response = await fetch(url, { headers: adminHeaders });
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

function createAuthAdminHeaders(secretKey: string) {
  return {
    apikey: secretKey,
    Authorization: `Bearer ${secretKey}`,
    'Content-Type': 'application/json',
  };
}

function createTemporaryPassword() {
  const alphabet =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const randomValues = new Uint32Array(9);
  crypto.getRandomValues(randomValues);
  const suffix = Array.from(
    randomValues,
    (value) => alphabet[value % alphabet.length],
  ).join('');

  return `Mo7!${suffix}`;
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
