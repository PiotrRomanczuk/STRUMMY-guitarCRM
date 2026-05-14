/**
 * @jest-environment node
 */
import { GET, PUT } from './route';
import { NextRequest } from 'next/server';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { createAdminClient } from '@/lib/supabase/admin';

jest.mock('@/lib/auth/withApiAuth');
jest.mock('@/lib/supabase/admin');
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

const mockUserContext = {
  user: { id: 'user-1', email: 'user@example.com' },
  roles: { isAdmin: false, isTeacher: false, isStudent: true },
};

const mockProfile = {
  id: 'user-1',
  email: 'user@example.com',
  full_name: 'John Doe',
  first_name: null,
  last_name: null,
  phone: '123456789',
  avatar_url: null,
  is_admin: false,
  is_teacher: false,
  is_student: true,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('Users Profile API - GET', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    (withApiAuth as jest.Mock).mockResolvedValue(
      Response.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const req = new NextRequest('http://localhost/api/users/profile');
    const response = await GET(req);
    expect(response.status).toBe(401);
  });

  it('returns the authenticated user profile', async () => {
    (withApiAuth as jest.Mock).mockImplementation(async (_req: unknown, handler: (ctx: unknown, req?: unknown) => Promise<Response>) => {
      return handler(mockUserContext, _req);
    });

    (createAdminClient as jest.Mock).mockReturnValue({
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
          })),
        })),
      })),
    });

    const req = new NextRequest('http://localhost/api/users/profile');
    const response = await GET(req);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.id).toBe('user-1');
    expect(data.full_name).toBe('John Doe');
  });
});

describe('Users Profile API - PUT', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    (withApiAuth as jest.Mock).mockResolvedValue(
      Response.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const request = new NextRequest('http://localhost/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify({ full_name: 'New Name' }),
    });

    const response = await PUT(request);
    expect(response.status).toBe(401);
  });

  it('returns 400 for invalid body', async () => {
    (withApiAuth as jest.Mock).mockImplementation(async (_req: unknown, handler: (ctx: unknown, req?: unknown) => Promise<Response>) => {
      return handler(mockUserContext, _req);
    });

    const request = new NextRequest('http://localhost/api/users/profile', {
      method: 'PUT',
      body: 'not json',
    });

    const response = await PUT(request);
    expect(response.status).toBe(400);
  });

  it('returns 400 when no fields provided', async () => {
    (withApiAuth as jest.Mock).mockImplementation(async (_req: unknown, handler: (ctx: unknown, req?: unknown) => Promise<Response>) => {
      return handler(mockUserContext, _req);
    });

    const request = new NextRequest('http://localhost/api/users/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await PUT(request);
    expect(response.status).toBe(400);
  });

  it('rejects role escalation fields silently', async () => {
    (withApiAuth as jest.Mock).mockImplementation(async (_req: unknown, handler: (ctx: unknown, req?: unknown) => Promise<Response>) => {
      return handler(mockUserContext, _req);
    });

    const request = new NextRequest('http://localhost/api/users/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_admin: true }),
    });

    const response = await PUT(request);
    expect(response.status).toBe(400);
  });

  it('updates profile with valid fields', async () => {
    (withApiAuth as jest.Mock).mockImplementation(async (_req: unknown, handler: (ctx: unknown, req?: unknown) => Promise<Response>) => {
      return handler(mockUserContext, _req);
    });

    const updatedProfile = { ...mockProfile, full_name: 'Jane Updated' };

    (createAdminClient as jest.Mock).mockReturnValue({
      from: jest.fn(() => ({
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({ data: updatedProfile, error: null }),
            })),
          })),
        })),
      })),
    });

    const request = new NextRequest('http://localhost/api/users/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: 'Jane Updated' }),
    });

    const response = await PUT(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.full_name).toBe('Jane Updated');
  });
});
