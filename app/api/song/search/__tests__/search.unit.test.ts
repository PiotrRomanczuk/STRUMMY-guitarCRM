/**
 * Unit tests for song search route — PostgREST filter injection fix (KAN-17)
 *
 * Tests:
 * 1. sanitizePostgrestFilter strips all PostgREST structural characters
 * 2. Normal alphanumeric queries pass through unchanged
 * 3. The GET handler calls .or() with the sanitized value
 * 4. A pure-injection input (only special chars) skips the .or() call entirely
 */

import { NextRequest } from 'next/server';
import { sanitizePostgrestFilter, GET } from '@/app/api/song/search/route';
import { authenticateRequest } from '@/lib/auth/api-auth';
import { createAdminClient } from '@/lib/supabase/admin';

jest.mock('@/lib/auth/api-auth', () => ({
  authenticateRequest: jest.fn(),
}));

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Pure unit tests for the sanitizer helper
// ---------------------------------------------------------------------------

describe('sanitizePostgrestFilter', () => {
  it('returns an unchanged string when input has no special chars', () => {
    expect(sanitizePostgrestFilter('hello world')).toBe('hello world');
  });

  it('strips commas that could split the or() clause', () => {
    expect(sanitizePostgrestFilter('a,b')).toBe('ab');
  });

  it('strips dots that are the field/operator separator in PostgREST', () => {
    expect(sanitizePostgrestFilter('a.b.c')).toBe('abc');
  });

  it('strips colons used in PostgREST filter syntax', () => {
    expect(sanitizePostgrestFilter('key:value')).toBe('keyvalue');
  });

  it('strips parentheses used for PostgREST grouping', () => {
    expect(sanitizePostgrestFilter('(nested)')).toBe('nested');
  });

  it('strips percent signs to prevent wildcard injection', () => {
    expect(sanitizePostgrestFilter('%secret%')).toBe('secret');
  });

  it('strips a known injection payload: %25,title.eq.secret', () => {
    // URL-decoded form of a common PostgREST injection attempt
    const malicious = '%,title.eq.secret';
    const result = sanitizePostgrestFilter(malicious);
    // All structural chars removed — what remains is just letters
    expect(result).toBe('titleeqsecret');
    expect(result).not.toContain(',');
    expect(result).not.toContain('.');
    expect(result).not.toContain('%');
  });

  it('handles an empty string without throwing', () => {
    expect(sanitizePostgrestFilter('')).toBe('');
  });

  it('preserves alphanumeric characters and spaces', () => {
    expect(sanitizePostgrestFilter('Bohemian Rhapsody 2')).toBe('Bohemian Rhapsody 2');
  });

  it('preserves hyphens and underscores (not structural in PostgREST)', () => {
    expect(sanitizePostgrestFilter('my-song_title')).toBe('my-song_title');
  });
});

// ---------------------------------------------------------------------------
// Integration-style tests for the GET handler (mocked Supabase)
// ---------------------------------------------------------------------------

describe('GET /api/song/search', () => {
  const mockUser = { id: 'user-123', email: 'teacher@example.com' };
  const mockSongs = [
    { id: '1', title: 'Stairway to Heaven', author: 'Led Zeppelin' },
    { id: '2', title: 'Bohemian Rhapsody', author: 'Queen' },
  ];

  let mockSupabase: {
    from: jest.Mock;
    select: jest.Mock;
    or: jest.Mock;
    eq: jest.Mock;
    ilike: jest.Mock;
    not: jest.Mock;
    range: jest.Mock;
    order: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: mockSongs,
        error: null,
        count: 2,
      }),
    };

    (authenticateRequest as jest.Mock).mockResolvedValue({ user: mockUser, status: 200 });
    (createAdminClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  it('returns 401 when the user is not authenticated', async () => {
    (authenticateRequest as jest.Mock).mockResolvedValue({
      user: null,
      error: 'Unauthorized',
      status: 401,
    });

    const req = new NextRequest('http://localhost/api/song/search');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('searches successfully with a clean alphanumeric query', async () => {
    const req = new NextRequest('http://localhost/api/song/search?q=stairway');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.songs).toHaveLength(2);
    expect(mockSupabase.or).toHaveBeenCalledWith(
      'title.ilike.%stairway%,author.ilike.%stairway%,chords.ilike.%stairway%'
    );
  });

  it('sanitizes special chars before building the PostgREST filter', async () => {
    // Injection attempt: user supplies a value with commas and dots to break
    // the or() filter structure
    const req = new NextRequest('http://localhost/api/song/search?q=rock%2Ctitle.eq.admin');
    const res = await GET(req);

    expect(res.status).toBe(200);
    // The .or() must be called with the sanitized value — no comma or dot
    expect(mockSupabase.or).toHaveBeenCalledWith(
      'title.ilike.%rocktitleeqadmin%,author.ilike.%rocktitleeqadmin%,chords.ilike.%rocktitleeqadmin%'
    );
  });

  it('skips the .or() call entirely when the sanitized query is empty', async () => {
    // Input consists solely of special chars — after sanitization it's empty
    const req = new NextRequest('http://localhost/api/song/search?q=%25%2C.');
    const res = await GET(req);

    expect(res.status).toBe(200);
    // No filter should have been applied
    expect(mockSupabase.or).not.toHaveBeenCalled();
  });

  it('returns songs with pagination metadata', async () => {
    const req = new NextRequest('http://localhost/api/song/search?q=queen&page=1&limit=10');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1,
    });
  });

  it('returns an empty result set without error when no songs match', async () => {
    mockSupabase.order.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    });

    const req = new NextRequest('http://localhost/api/song/search?q=nonexistent');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.songs).toHaveLength(0);
    expect(body.pagination.total).toBe(0);
  });

  it('returns 500 and does not leak error details on a database failure', async () => {
    mockSupabase.order.mockResolvedValue({
      data: null,
      error: { message: 'relation songs does not exist' },
      count: null,
    });

    const req = new NextRequest('http://localhost/api/song/search?q=test');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    // The error message from Supabase is forwarded here; it must NOT be a
    // stack trace or internal path.
    expect(body.error).toBeDefined();
    expect(body.error).not.toMatch(/at\s+\w+\s+\(/); // no stack trace lines
  });
});
