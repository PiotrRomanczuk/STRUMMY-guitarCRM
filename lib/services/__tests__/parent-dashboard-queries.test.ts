import { getParentChildren, resolveActiveChildId } from '../parent-dashboard-queries';
import type { ParentChild } from '../parent-dashboard-queries';

const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      from: jest.fn(() => {
        const chain = {
          select: mockSelect.mockImplementation(() => chain),
          eq: mockEq.mockImplementation(() => chain),
          order: mockOrder,
        };
        return chain;
      }),
    })
  ),
}));

jest.mock('@/lib/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

const child = (id: string): ParentChild => ({ id, name: `Child ${id}`, email: null });

describe('resolveActiveChildId', () => {
  it('returns null when there are no linked children', () => {
    expect(resolveActiveChildId([], 'anything')).toBeNull();
  });

  it('returns the requested child when it is actually linked', () => {
    expect(resolveActiveChildId([child('a'), child('b')], 'b')).toBe('b');
  });

  it('falls back to the first child when the requested id is not linked', () => {
    expect(resolveActiveChildId([child('a'), child('b')], 'ghost')).toBe('a');
  });

  it('falls back to the first child when no id is requested', () => {
    expect(resolveActiveChildId([child('a'), child('b')], undefined)).toBe('a');
  });
});

describe('getParentChildren', () => {
  beforeEach(() => jest.clearAllMocks());

  it('maps rows and falls back name → email → "Your child"', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [
        { id: 'c1', full_name: 'Lily Park', email: 'lily@example.com' },
        { id: 'c2', full_name: null, email: 'sam@example.com' },
        { id: 'c3', full_name: null, email: null },
      ],
      error: null,
    });

    const children = await getParentChildren('parent-1');

    expect(mockEq).toHaveBeenCalledWith('parent_id', 'parent-1');
    expect(children).toEqual([
      { id: 'c1', name: 'Lily Park', email: 'lily@example.com' },
      { id: 'c2', name: 'sam@example.com', email: 'sam@example.com' },
      { id: 'c3', name: 'Your child', email: null },
    ]);
  });

  it('returns an empty list on error', async () => {
    mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'boom' } });
    expect(await getParentChildren('parent-1')).toEqual([]);
  });
});
