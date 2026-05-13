/**
 * @jest-environment node
 *
 * Bearer-authenticated route that calls the Supabase Auth Admin API to bulk
 * set passwords by user id. Touching ANY user's password — must reject every
 * non-service-role caller and never echo the plain password.
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const ORIGINAL_ENV = process.env;
const VALID_KEY = 'service-role-test-key';
const SUPABASE_URL = 'https://example.supabase.co';

function buildRequest(opts: {
  authHeader?: string | null;
  body?: unknown;
  raw?: string;
}): NextRequest {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.authHeader) headers.authorization = opts.authHeader;
  return new NextRequest('http://localhost/api/admin/set-passwords', {
    method: 'POST',
    headers,
    body: opts.raw ?? JSON.stringify(opts.body),
  });
}

async function loadRoute() {
  // Re-import after env mutation so the env-guarded constants pick up changes.
  jest.resetModules();
  return import('./route');
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env = {
    ...ORIGINAL_ENV,
    SUPABASE_SERVICE_ROLE_KEY: VALID_KEY,
    SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL,
  };
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      text: () => Promise.resolve('{"id":"u1"}'),
    } as unknown as Response)
  );
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe('POST /api/admin/set-passwords — env guards', () => {
  it('returns 500 when SUPABASE_SERVICE_ROLE_KEY is missing', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const { POST } = await loadRoute();
    const res = await POST(buildRequest({ authHeader: `Bearer ${VALID_KEY}`, body: [] }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Server configuration error');
  });

  it('returns 500 when neither SUPABASE_URL nor NEXT_PUBLIC_SUPABASE_URL is set', async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    const { POST } = await loadRoute();
    const res = await POST(buildRequest({ authHeader: `Bearer ${VALID_KEY}`, body: [] }));
    expect(res.status).toBe(500);
  });
});

describe('POST /api/admin/set-passwords — bearer auth boundary', () => {
  it('returns 401 when Authorization header is missing', async () => {
    const { POST } = await loadRoute();
    const res = await POST(buildRequest({ body: [] }));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Unauthorized');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns 401 for a non-Bearer scheme (e.g. Basic auth)', async () => {
    const { POST } = await loadRoute();
    const res = await POST(buildRequest({ authHeader: `Basic ${VALID_KEY}`, body: [] }));
    expect(res.status).toBe(401);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns 401 when the Bearer token does not match SERVICE_ROLE_KEY', async () => {
    const { POST } = await loadRoute();
    const res = await POST(buildRequest({ authHeader: 'Bearer wrong-key', body: [] }));
    expect(res.status).toBe(401);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('does not accept a session cookie as authentication (bearer-only)', async () => {
    const { POST } = await loadRoute();
    const req = new NextRequest('http://localhost/api/admin/set-passwords', {
      method: 'POST',
      headers: { cookie: 'sb-access-token=abc' },
      body: JSON.stringify([]),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('POST /api/admin/set-passwords — payload validation', () => {
  it('returns 400 for invalid JSON', async () => {
    const { POST } = await loadRoute();
    const res = await POST(buildRequest({ authHeader: `Bearer ${VALID_KEY}`, raw: '{not json' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid JSON or payload');
  });

  it('returns 400 when payload is not an array', async () => {
    const { POST } = await loadRoute();
    const res = await POST(
      buildRequest({
        authHeader: `Bearer ${VALID_KEY}`,
        body: { id: 'u1', password: 'p' },
      })
    );
    expect(res.status).toBe(400);
  });

  it('reports a per-row 400 for entries missing id or password', async () => {
    const { POST } = await loadRoute();
    const res = await POST(
      buildRequest({
        authHeader: `Bearer ${VALID_KEY}`,
        body: [{ id: '', password: 'p' }, { id: 'u1' }],
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results).toHaveLength(2);
    expect(body.results[0]).toMatchObject({ ok: false, status: 400 });
    expect(body.results[1]).toMatchObject({ ok: false, status: 400 });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('POST /api/admin/set-passwords — happy path', () => {
  it('forwards each user to PUT /auth/v1/admin/users/:id with the service-role key', async () => {
    const { POST } = await loadRoute();
    const res = await POST(
      buildRequest({
        authHeader: `Bearer ${VALID_KEY}`,
        body: [{ id: 'user-1', password: 'NewPass123!' }],
      })
    );
    expect(res.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe(`${SUPABASE_URL}/auth/v1/admin/users/user-1`);
    expect(init.method).toBe('PUT');
    expect(init.headers.Authorization).toBe(`Bearer ${VALID_KEY}`);
    expect(JSON.parse(init.body)).toEqual({ password: 'NewPass123!' });
  });

  it('encodes user ids that contain reserved URL characters', async () => {
    const { POST } = await loadRoute();
    await POST(
      buildRequest({
        authHeader: `Bearer ${VALID_KEY}`,
        body: [{ id: 'user/with slash', password: 'p' }],
      })
    );
    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('user%2Fwith%20slash');
  });

  it('does not echo the plain password back in the response', async () => {
    const { POST } = await loadRoute();
    const res = await POST(
      buildRequest({
        authHeader: `Bearer ${VALID_KEY}`,
        body: [{ id: 'user-1', password: 'top-secret' }],
      })
    );
    const body = await res.json();
    expect(JSON.stringify(body)).not.toContain('top-secret');
  });

  it('reports per-user failure status without aborting the rest of the batch', async () => {
    let call = 0;
    (global.fetch as jest.Mock).mockImplementation(() => {
      call++;
      if (call === 1) {
        return Promise.resolve({
          ok: false,
          status: 422,
          text: () => Promise.resolve('{"error":"weak password"}'),
        } as unknown as Response);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve('{"ok":true}'),
      } as unknown as Response);
    });

    const { POST } = await loadRoute();
    const res = await POST(
      buildRequest({
        authHeader: `Bearer ${VALID_KEY}`,
        body: [
          { id: 'u1', password: 'weak' },
          { id: 'u2', password: 'StrongPass1!' },
        ],
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results).toHaveLength(2);
    expect(body.results[0]).toMatchObject({ id: 'u1', ok: false, status: 422 });
    expect(body.results[1]).toMatchObject({ id: 'u2', ok: true, status: 200 });
  });

  it('captures fetch network errors as ok=false / status=500', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('ECONNRESET'));
    const { POST } = await loadRoute();
    const res = await POST(
      buildRequest({
        authHeader: `Bearer ${VALID_KEY}`,
        body: [{ id: 'u1', password: 'p' }],
      })
    );
    const body = await res.json();
    expect(body.results[0]).toMatchObject({ id: 'u1', ok: false, status: 500 });
  });
});
