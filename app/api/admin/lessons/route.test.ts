import { GET, POST } from './route';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getLessonsHandler, createLessonHandler } from '../../lessons/handlers';
import type { AuthedProfile } from '@/lib/auth/loadAuthedProfile';

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('../../lessons/handlers', () => ({
  getLessonsHandler: jest.fn(),
  createLessonHandler: jest.fn(),
}));

// Controllable withApiAuth mock — set _authedProfile to control auth state
let _authedProfile: AuthedProfile | null = null;

jest.mock('@/lib/auth/withApiAuth', () => ({
  withApiAuth: jest.fn(
    async (
      _req: Request,
      handler: (authed: AuthedProfile, req: Request) => Promise<Response>,
      _options?: unknown
    ) => {
      if (!_authedProfile) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (!(_authedProfile as { roles?: { isAdmin?: boolean } }).roles?.isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return handler(_authedProfile, _req);
    }
  ),
}));

describe('Admin Lessons API', () => {
  const mockSupabase = {
    from: jest.fn(),
  };

  const adminProfile: AuthedProfile = {
    user: { id: 'admin1', email: 'admin@test.com' } as AuthedProfile['user'],
    profile: { id: 'admin1', is_admin: true } as AuthedProfile['profile'],
    roles: { isAdmin: true, isTeacher: false, isStudent: false },
    flags: {},
  } as unknown as AuthedProfile;

  beforeEach(() => {
    jest.clearAllMocks();
    _authedProfile = adminProfile;
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('GET', () => {
    it('returns 401 if not authenticated', async () => {
      _authedProfile = null;

      const req = new NextRequest('http://localhost/api/admin/lessons');
      const res = await GET(req);

      expect(res.status).toBe(401);
    });

    it('returns 403 if not admin', async () => {
      _authedProfile = {
        ...adminProfile,
        roles: { isAdmin: false, isTeacher: false, isStudent: true },
      } as unknown as AuthedProfile;

      const req = new NextRequest('http://localhost/api/admin/lessons');
      const res = await GET(req);

      expect(res.status).toBe(403);
    });

    it('returns lessons if admin', async () => {
      (getLessonsHandler as jest.Mock).mockResolvedValue({
        lessons: [{ id: 1 }],
        count: 1,
        status: 200,
      });

      const req = new NextRequest('http://localhost/api/admin/lessons?page=1');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.lessons).toHaveLength(1);
      expect(getLessonsHandler).toHaveBeenCalled();
    });

    it('handles handler errors', async () => {
      (getLessonsHandler as jest.Mock).mockResolvedValue({
        error: 'DB Error',
        status: 500,
      });

      const req = new NextRequest('http://localhost/api/admin/lessons');
      const res = await GET(req);

      expect(res.status).toBe(500);
    });
  });

  describe('POST', () => {
    it('returns 401 if not authenticated', async () => {
      _authedProfile = null;

      const req = new NextRequest('http://localhost/api/admin/lessons', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const res = await POST(req);

      expect(res.status).toBe(401);
    });

    it('returns 403 if not admin', async () => {
      _authedProfile = {
        ...adminProfile,
        roles: { isAdmin: false, isTeacher: false, isStudent: true },
      } as unknown as AuthedProfile;

      const req = new NextRequest('http://localhost/api/admin/lessons', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const res = await POST(req);

      expect(res.status).toBe(403);
    });

    it('creates lesson if admin', async () => {
      (createLessonHandler as jest.Mock).mockResolvedValue({
        lesson: { id: 1 },
        status: 201,
      });

      const req = new NextRequest('http://localhost/api/admin/lessons', {
        method: 'POST',
        body: JSON.stringify({ title: 'New Lesson' }),
      });
      const res = await POST(req);

      expect(res.status).toBe(201);
      expect(createLessonHandler).toHaveBeenCalled();
    });
  });
});
