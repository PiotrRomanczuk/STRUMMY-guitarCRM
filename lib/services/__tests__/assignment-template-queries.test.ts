import { getAssignmentTemplate, getAssignmentTemplates } from '../assignment-template-queries';
import { logger } from '@/lib/logger';

const mockOrder = jest.fn();
const mockSingle = jest.fn();

jest.mock('@/lib/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      from: () => ({
        select: () => ({
          order: () => mockOrder(),
          eq: () => ({ single: () => mockSingle() }),
        }),
      }),
    })
  ),
}));

describe('getAssignmentTemplates', () => {
  beforeEach(() => jest.clearAllMocks());

  it('maps rows and parses the checklist', async () => {
    mockOrder.mockResolvedValue({
      data: [
        {
          id: 't1',
          title: 'Scale week',
          description: 'Majors',
          checklist: [{ id: 'a', text: 'C major', done: false }],
          updated_at: '2026-07-01T00:00:00Z',
        },
      ],
      error: null,
    });

    const rows = await getAssignmentTemplates();
    expect(rows).toEqual([
      {
        id: 't1',
        title: 'Scale week',
        description: 'Majors',
        checklist: [{ id: 'a', text: 'C major', done: false }],
        updatedAt: '2026-07-01T00:00:00Z',
      },
    ]);
  });

  it('coerces a malformed checklist to an empty array', async () => {
    mockOrder.mockResolvedValue({
      data: [
        {
          id: 't2',
          title: 'X',
          description: null,
          checklist: null,
          updated_at: '2026-07-02T00:00:00Z',
        },
      ],
      error: null,
    });
    const rows = await getAssignmentTemplates();
    expect(rows[0].checklist).toEqual([]);
  });

  it('returns [] on error', async () => {
    mockOrder.mockResolvedValue({ data: null, error: { message: 'boom' } });
    expect(await getAssignmentTemplates()).toEqual([]);
  });

  it('returns [] when supabase resolves a null payload without error', async () => {
    mockOrder.mockResolvedValue({ data: null, error: null });
    expect(await getAssignmentTemplates()).toEqual([]);
    expect(logger.warn).not.toHaveBeenCalled();
  });
});

describe('getAssignmentTemplate', () => {
  beforeEach(() => jest.clearAllMocks());

  it('maps a single row', async () => {
    mockSingle.mockResolvedValue({
      data: {
        id: 't1',
        title: 'Scale week',
        description: null,
        checklist: [],
        updated_at: '2026-07-01T00:00:00Z',
      },
      error: null,
    });
    const row = await getAssignmentTemplate('t1');
    expect(row?.id).toBe('t1');
    expect(row?.checklist).toEqual([]);
  });

  it('returns null when not found', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'no rows' } });
    expect(await getAssignmentTemplate('nope')).toBeNull();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('returns null and logs on a non-PGRST116 error', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: '42501', message: 'denied' } });
    expect(await getAssignmentTemplate('t1')).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith('[assignment-template-queries] detail error', {
      error: 'denied',
    });
  });

  it('returns null when supabase resolves a null payload without error', async () => {
    mockSingle.mockResolvedValue({ data: null, error: null });
    expect(await getAssignmentTemplate('t1')).toBeNull();
    expect(logger.warn).not.toHaveBeenCalled();
  });
});
