import { createListResponse } from '../response';

describe('createListResponse', () => {
  it('returns the domain key and pagination object', () => {
    const result = createListResponse('lessons', [{ id: '1' }, { id: '2' }], {
      total: 2,
      page: 1,
      limit: 20,
    });

    expect(result.lessons).toHaveLength(2);
    expect(result.pagination).toEqual({ page: 1, limit: 20, total: 2, totalPages: 1 });
  });

  it('calculates totalPages correctly', () => {
    const result = createListResponse('songs', [], { total: 84, page: 2, limit: 20 });
    expect(result.pagination.totalPages).toBe(5);
  });

  it('defaults page to 1 when omitted', () => {
    const result = createListResponse('assignments', [], { total: 10, limit: 5 });
    expect(result.pagination.page).toBe(1);
  });

  it('defaults limit to total when omitted (unpaginated list)', () => {
    const result = createListResponse('favorites', [{ id: 'a' }], { total: 1 });
    expect(result.pagination.limit).toBe(1);
    expect(result.pagination.totalPages).toBe(1);
  });

  it('handles empty list', () => {
    const result = createListResponse('lessons', [], { total: 0, page: 1, limit: 20 });
    expect(result.lessons).toEqual([]);
    expect(result.pagination).toEqual({ page: 1, limit: 20, total: 0, totalPages: 0 });
  });

  it('is dual-emit safe — spread does not overwrite domain key', () => {
    const base = createListResponse('lessons', [{ id: '1' }], { total: 42, page: 1, limit: 20 });
    const response = { ...base, count: 42 };
    expect(response.lessons).toHaveLength(1);
    expect(response.count).toBe(42);
    expect(response.pagination.total).toBe(42);
  });
});
