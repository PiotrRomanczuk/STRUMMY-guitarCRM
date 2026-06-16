/**
 * Bulk lessons route — request-body parse guard regression tests.
 *
 * Focuses on the empty/malformed JSON body guard added in STRUM-p0 (0.6 / 11A):
 * an empty body must return 400, never fall through to the generic 500 catch.
 *
 * `withApiAuth` is mocked to pass through as an authenticated teacher so these
 * tests isolate the body-parse behaviour from the auth seam (which has its own
 * coverage). The Supabase client is mocked but should never be reached for a
 * malformed body.
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/auth/withApiAuth', () => ({
  withApiAuth: jest.fn(
    (
      request: NextRequest,
      handler: (authed: {
        user: { id: string };
        roles: { isAdmin: boolean; isTeacher: boolean; isStudent: boolean };
      }) => Promise<Response>
    ) =>
      handler({
        user: { id: '00000003-0000-4000-a000-000000000003' },
        roles: { isAdmin: false, isTeacher: true, isStudent: false },
      })
  ),
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [] }),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  }),
}));

import { DELETE, POST, PUT } from '@/app/api/lessons/bulk/route';

describe('Bulk lessons route — JSON body guard', () => {
  it('DELETE with an empty body returns 400 (not 500)', async () => {
    const request = new NextRequest('http://localhost:3000/api/lessons/bulk', {
      method: 'DELETE',
    });

    const response = await DELETE(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid JSON body');
  });

  it('DELETE with malformed JSON returns 400', async () => {
    const request = new NextRequest('http://localhost:3000/api/lessons/bulk', {
      method: 'DELETE',
      body: '{ not valid json',
    });

    const response = await DELETE(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid JSON body');
  });

  it('POST with an empty body returns 400 (not 500)', async () => {
    const request = new NextRequest('http://localhost:3000/api/lessons/bulk', {
      method: 'POST',
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid JSON body');
  });

  it('PUT with an empty body returns 400 (not 500)', async () => {
    const request = new NextRequest('http://localhost:3000/api/lessons/bulk', {
      method: 'PUT',
    });

    const response = await PUT(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid JSON body');
  });

  it('DELETE with a valid body but missing lessonIds still returns 400', async () => {
    const request = new NextRequest('http://localhost:3000/api/lessons/bulk', {
      method: 'DELETE',
      body: JSON.stringify({}),
    });

    const response = await DELETE(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Lesson IDs array is required and cannot be empty');
  });
});
