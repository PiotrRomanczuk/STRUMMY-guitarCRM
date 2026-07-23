import {
  statusHref,
  sortHref,
  yearHref,
  yearOptions,
  type LessonsListState,
} from './LessonsListEditorial.helpers';

const base: LessonsListState = {
  statuses: [],
  sort: 'newest',
  year: undefined,
  flat: false,
};

describe('statusHref', () => {
  it('adds a status and preserves year (grouped view emits no sort param)', () => {
    const href = statusHref({ ...base, year: 2025 }, 'scheduled');
    expect(href).toBe('/dashboard/lessons?status=scheduled&year=2025');
  });

  it('removes an already-active status', () => {
    const href = statusHref({ ...base, statuses: ['scheduled', 'completed'] }, 'scheduled');
    expect(href).toBe('/dashboard/lessons?status=completed');
  });

  it('drops the status param when all four are selected', () => {
    const href = statusHref(
      { ...base, statuses: ['scheduled', 'in_progress', 'completed'] },
      'cancelled'
    );
    expect(href).toBe('/dashboard/lessons');
  });

  it('keeps the sort param while flat', () => {
    const href = statusHref({ ...base, sort: 'oldest', flat: true }, 'completed');
    expect(href).toBe('/dashboard/lessons?status=completed&sort=oldest');
  });
});

describe('sortHref', () => {
  it('flips newest -> oldest and enters the flat table', () => {
    expect(sortHref(base)).toBe('/dashboard/lessons?sort=oldest');
  });

  it('flips oldest -> newest, preserving statuses and year', () => {
    const href = sortHref({ statuses: ['completed'], sort: 'oldest', year: 2024, flat: true });
    expect(href).toBe('/dashboard/lessons?status=completed&sort=newest&year=2024');
  });
});

describe('yearHref', () => {
  it('sets a year, preserving statuses (grouped view)', () => {
    expect(yearHref({ ...base, statuses: ['scheduled'] }, 2023)).toBe(
      '/dashboard/lessons?status=scheduled&year=2023'
    );
  });

  it('clears the year while keeping an active flat sort', () => {
    expect(yearHref({ ...base, sort: 'oldest', year: 2025, flat: true }, undefined)).toBe(
      '/dashboard/lessons?sort=oldest'
    );
  });
});

describe('yearOptions', () => {
  it('returns the current UTC year and the two prior', () => {
    expect(yearOptions(new Date('2026-03-01T00:00:00.000Z'))).toEqual([2026, 2025, 2024]);
  });
});
