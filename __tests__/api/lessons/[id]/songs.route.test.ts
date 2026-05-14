/**
 * @jest-environment node
 *
 * Unit tests for GET /api/lessons/[id]/songs
 */

import { GET } from '@/app/api/lessons/[id]/songs/route';
import { createClient } from '@/lib/supabase/server';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { NextRequest, NextResponse } from 'next/server';

jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
jest.mock('@/lib/auth/withApiAuth', () => ({ withApiAuth: jest.fn() }));
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

const LESSON_ID = '776dfd64-c31a-45dc-b32b-a365f3ebd4b9';
const SONG_ID = 'a7c2363e-1571-484d-a9fd-c625c4f82537';

const mockAdminContext = {
  user: { id: 'admin-user-id' },
  roles: { isAdmin: true, isTeacher: false, isStudent: false },
};

function makeRequest(): NextRequest {
  return new NextRequest(`http://localhost/api/lessons/${LESSON_ID}/songs`);
}

interface SongRow {
  id: string;
  song_id: string;
  status: string;
  notes: string | null;
  songs:
    | { id: string; title: string; author: string; level: string }
    | { id: string; title: string; author: string; level: string }[];
}

function buildSupabaseMock(rows: SongRow[] | null, error: { message: string } | null = null) {
  const builder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue({ data: rows, error }),
  };
  return { from: jest.fn().mockReturnValue(builder) };
}

describe('GET /api/lessons/[id]/songs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (withApiAuth as jest.Mock).mockImplementation(
      async (_req: unknown, handler: (ctx: unknown, req?: unknown) => Promise<Response>) => {
        return handler(mockAdminContext, _req);
      }
    );
  });

  it('returns 401 when withApiAuth rejects', async () => {
    (withApiAuth as jest.Mock).mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const res = await GET(makeRequest(), { params: Promise.resolve({ id: LESSON_ID }) });
    expect(res.status).toBe(401);
  });

  it('returns songs array for a valid lessonId', async () => {
    const rows: SongRow[] = [
      {
        id: 'ls-1',
        song_id: SONG_ID,
        status: 'started',
        notes: null,
        songs: { id: SONG_ID, title: 'Blackbird', author: 'Beatles', level: 'beginner' },
      },
    ];
    (createClient as jest.Mock).mockResolvedValue(buildSupabaseMock(rows));

    const res = await GET(makeRequest(), { params: Promise.resolve({ id: LESSON_ID }) });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body.songs)).toBe(true);
    expect(body.songs).toHaveLength(1);
    expect(body.songs[0].song_id).toBe(SONG_ID);
  });

  it('unwraps songs array into single object via Array.isArray transform', async () => {
    const rows: SongRow[] = [
      {
        id: 'ls-2',
        song_id: SONG_ID,
        status: 'mastered',
        notes: 'good progress',
        songs: [{ id: SONG_ID, title: 'Wonderwall', author: 'Oasis', level: 'intermediate' }],
      },
    ];
    (createClient as jest.Mock).mockResolvedValue(buildSupabaseMock(rows));

    const res = await GET(makeRequest(), { params: Promise.resolve({ id: LESSON_ID }) });
    const body = await res.json();

    expect(body.songs[0].song).toEqual({
      id: SONG_ID,
      title: 'Wonderwall',
      author: 'Oasis',
      level: 'intermediate',
    });
  });

  it('returns 500 on DB error', async () => {
    (createClient as jest.Mock).mockResolvedValue(
      buildSupabaseMock(null, { message: 'DB connection failed' })
    );

    const res = await GET(makeRequest(), { params: Promise.resolve({ id: LESSON_ID }) });
    expect(res.status).toBe(500);
  });

  it('returns empty array when no songs found', async () => {
    (createClient as jest.Mock).mockResolvedValue(buildSupabaseMock([]));

    const res = await GET(makeRequest(), { params: Promise.resolve({ id: LESSON_ID }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.songs).toEqual([]);
  });
});
