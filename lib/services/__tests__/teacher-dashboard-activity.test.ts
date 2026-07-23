import {
  getStudioActivity,
  mergeStudioActivity,
  relativeTimeLabel,
  type StudioActivityItem,
} from '../teacher-dashboard-activity';
import { logger } from '@/lib/logger';

const item = (over: Partial<StudioActivityItem>): StudioActivityItem => ({
  id: 'x',
  type: 'practice',
  actorName: 'Emma',
  actorEmail: 'emma@e.c',
  action: 'practiced',
  object: 'Wonderwall',
  occurredAt: '2026-07-20T10:00:00.000Z',
  ...over,
});

describe('mergeStudioActivity (pure)', () => {
  it('flattens groups, sorts newest-first and caps at the limit', () => {
    const a = item({ id: 'a', occurredAt: '2026-07-20T09:00:00.000Z' });
    const b = item({ id: 'b', occurredAt: '2026-07-20T12:00:00.000Z' });
    const c = item({ id: 'c', occurredAt: '2026-07-20T11:00:00.000Z' });

    const merged = mergeStudioActivity([[a], [b, c]], 2);

    expect(merged.map((m) => m.id)).toEqual(['b', 'c']);
  });

  it('drops items without a timestamp', () => {
    const good = item({ id: 'good' });
    const bad = item({ id: 'bad', occurredAt: '' });

    expect(mergeStudioActivity([[good, bad]], 10).map((m) => m.id)).toEqual(['good']);
  });

  it('returns an empty array for empty groups', () => {
    expect(mergeStudioActivity([[], []], 5)).toEqual([]);
  });
});

describe('relativeTimeLabel (pure)', () => {
  const now = new Date('2026-07-20T12:00:00.000Z');

  it.each([
    ['2026-07-20T11:59:40.000Z', 'now'],
    ['2026-07-20T11:45:00.000Z', '15m'],
    ['2026-07-20T09:00:00.000Z', '3h'],
    ['2026-07-18T12:00:00.000Z', '2d'],
    ['2026-07-01T12:00:00.000Z', '2w'],
  ])('formats %s as %s', (iso, expected) => {
    expect(relativeTimeLabel(iso, now)).toBe(expected);
  });
});

// --- getStudioActivity: mock the supabase query builder (matches the style in
// teacher-dashboard-backfill-queries.test.ts). The three parallel reads resolve
// off .limit(); the first roster read resolves off .is().
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockIs = jest.fn();
const mockIn = jest.fn();
const mockGte = jest.fn();
const mockOrder = jest.fn();
const mockLimit = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      from: jest.fn(() => {
        const chain = {
          select: mockSelect.mockImplementation(() => chain),
          eq: mockEq.mockImplementation(() => chain),
          is: mockIs.mockImplementation(() => chain),
          in: mockIn.mockImplementation(() => chain),
          gte: mockGte.mockImplementation(() => chain),
          order: mockOrder.mockImplementation(() => chain),
          limit: mockLimit.mockImplementation(() => chain),
        };
        return chain;
      }),
    })
  ),
}));

jest.mock('@/lib/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

describe('getStudioActivity', () => {
  const NOW = new Date('2026-07-20T12:00:00.000Z');

  beforeEach(() => jest.clearAllMocks());

  it('returns [] when the teacher has no students', async () => {
    mockIs.mockResolvedValueOnce({ data: [], error: null });
    expect(await getStudioActivity('t1', NOW)).toEqual([]);
  });

  it('merges practice, assignment and lesson rows newest-first', async () => {
    // 1st awaited call = roster (.is), then the three parallel reads (.limit).
    mockIs.mockResolvedValueOnce({ data: [{ student_id: 's1' }], error: null });
    mockLimit
      .mockResolvedValueOnce({
        data: [
          {
            id: 'p1',
            created_at: '2026-07-20T11:00:00.000Z',
            student: [{ full_name: 'Emma', email: 'emma@e.c' }],
            song: [{ title: 'Wonderwall' }],
          },
        ],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [
          {
            id: 'a1',
            title: 'Scales',
            updated_at: '2026-07-20T11:30:00.000Z',
            student: { full_name: 'Liam', email: 'liam@e.c' },
          },
        ],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [
          {
            id: 'l1',
            scheduled_at: '2026-07-20T10:00:00.000Z',
            student: { full_name: 'Noah', email: 'noah@e.c' },
          },
        ],
        error: null,
      });

    const result = await getStudioActivity('t1', NOW, 8);

    expect(result.map((r) => r.id)).toEqual(['assignment-a1', 'practice-p1', 'lesson-l1']);
    expect(result[0]).toMatchObject({ type: 'assignment', action: 'completed', object: 'Scales' });
    expect(result[1]).toMatchObject({ type: 'practice', object: 'Wonderwall', actorName: 'Emma' });
    expect(result[2]).toMatchObject({ type: 'lesson', action: 'finished a lesson', object: null });
  });

  it('logs a warning but still returns rows when one query errors', async () => {
    mockIs.mockResolvedValueOnce({ data: [{ student_id: 's1' }], error: null });
    mockLimit
      .mockResolvedValueOnce({ data: null, error: { message: 'practice boom' } })
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({
        data: [{ id: 'l1', scheduled_at: '2026-07-20T10:00:00.000Z', student: null }],
        error: null,
      });

    const result = await getStudioActivity('t1', NOW);

    expect(result.map((r) => r.id)).toEqual(['lesson-l1']);
    expect(result[0].actorName).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(
      '[teacher-dashboard-activity] query error',
      expect.objectContaining({ practice: 'practice boom' })
    );
  });
});
