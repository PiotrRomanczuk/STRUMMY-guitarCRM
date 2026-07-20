import {
  buildAssignmentListResult,
  deriveEffectiveStatus,
  parseAssignmentListParams,
  sortAssignments,
  tallyAssignmentCounts,
  type AssignmentListParams,
  type AssignmentRow,
} from '@/lib/services/assignment-list-params';

const PAST = '2020-01-01T00:00:00Z';
const FUTURE = '2999-01-01T00:00:00Z';

function makeRow(partial: Partial<AssignmentRow> & { id: string; status: string }): AssignmentRow {
  const dueDate = partial.dueDate ?? null;
  return {
    title: partial.title ?? `Assignment ${partial.id}`,
    effectiveStatus: deriveEffectiveStatus(dueDate, partial.status),
    dueDate,
    teacherId: 't1',
    studentId: partial.studentId ?? 's1',
    studentName: partial.studentName ?? 'Emma',
    studentEmail: partial.studentEmail ?? 'emma@example.com',
    createdAt: partial.createdAt ?? '2026-01-01T00:00:00Z',
    updatedAt: partial.updatedAt ?? partial.createdAt ?? '2026-01-01T00:00:00Z',
    progress: partial.progress ?? { done: 0, total: 0 },
    ...partial,
  };
}

const defaults: AssignmentListParams = { dir: 'asc' };

describe('parseAssignmentListParams', () => {
  it('returns defaults for empty params', () => {
    expect(parseAssignmentListParams({})).toEqual({
      status: undefined,
      studentId: undefined,
      search: undefined,
      sort: undefined,
      dir: 'asc',
    });
  });

  it('accepts a valid status and ignores an invalid one', () => {
    expect(parseAssignmentListParams({ status: 'overdue' }).status).toBe('overdue');
    expect(parseAssignmentListParams({ status: 'pending' }).status).toBeUndefined();
    expect(parseAssignmentListParams({ status: 'garbage' }).status).toBeUndefined();
  });

  it('validates sort field and direction', () => {
    expect(parseAssignmentListParams({ sort: 'due_date', dir: 'desc' })).toMatchObject({
      sort: 'due_date',
      dir: 'desc',
    });
    expect(parseAssignmentListParams({ sort: 'nonsense' }).sort).toBeUndefined();
    expect(parseAssignmentListParams({ dir: 'sideways' }).dir).toBe('asc');
  });

  it('trims student and search, and takes the first value of an array param', () => {
    expect(parseAssignmentListParams({ student: '  s9  ', q: '  wonderwall ' })).toMatchObject({
      studentId: 's9',
      search: 'wonderwall',
    });
    expect(parseAssignmentListParams({ status: ['completed', 'overdue'] }).status).toBe(
      'completed'
    );
    expect(parseAssignmentListParams({ q: '   ' }).search).toBeUndefined();
  });
});

describe('deriveEffectiveStatus', () => {
  it('derives overdue for a past-due active assignment', () => {
    expect(deriveEffectiveStatus(PAST, 'not_started')).toBe('overdue');
    expect(deriveEffectiveStatus(PAST, 'in_progress')).toBe('overdue');
  });

  it('keeps completed/cancelled regardless of due date', () => {
    expect(deriveEffectiveStatus(PAST, 'completed')).toBe('completed');
    expect(deriveEffectiveStatus(PAST, 'cancelled')).toBe('cancelled');
  });

  it('leaves future/no due dates on their raw status', () => {
    expect(deriveEffectiveStatus(FUTURE, 'not_started')).toBe('not_started');
    expect(deriveEffectiveStatus(null, 'in_progress')).toBe('in_progress');
  });
});

describe('tallyAssignmentCounts', () => {
  it('counts by effective status with no legacy pending key', () => {
    const rows = [
      makeRow({ id: '1', status: 'not_started', dueDate: PAST }), // → overdue
      makeRow({ id: '2', status: 'not_started', dueDate: FUTURE }),
      makeRow({ id: '3', status: 'in_progress' }),
      makeRow({ id: '4', status: 'completed', dueDate: PAST }),
    ];
    const counts = tallyAssignmentCounts(rows);
    expect(counts).toEqual({
      all: 4,
      not_started: 1,
      in_progress: 1,
      completed: 1,
      overdue: 1,
      cancelled: 0,
    });
    expect(counts).not.toHaveProperty('pending');
  });
});

describe('sortAssignments', () => {
  it('needs-attention default: overdue first, then soonest due, then newest', () => {
    const rows = [
      makeRow({ id: 'future', status: 'not_started', dueDate: FUTURE }),
      makeRow({ id: 'overdue', status: 'not_started', dueDate: PAST }),
      makeRow({ id: 'nodue-new', status: 'in_progress', createdAt: '2026-05-01T00:00:00Z' }),
      makeRow({ id: 'nodue-old', status: 'in_progress', createdAt: '2026-01-01T00:00:00Z' }),
    ];
    const sorted = sortAssignments(rows, defaults).map((r) => r.id);
    expect(sorted[0]).toBe('overdue');
    expect(sorted[1]).toBe('future');
    // both no-due rows land last, newest before oldest
    expect(sorted.slice(2)).toEqual(['nodue-new', 'nodue-old']);
  });

  it('explicit title sort respects direction', () => {
    const rows = [
      makeRow({ id: 'b', status: 'not_started', title: 'Blackbird' }),
      makeRow({ id: 'a', status: 'not_started', title: 'Angie' }),
    ];
    expect(sortAssignments(rows, { sort: 'title', dir: 'asc' }).map((r) => r.title)).toEqual([
      'Angie',
      'Blackbird',
    ]);
    expect(sortAssignments(rows, { sort: 'title', dir: 'desc' }).map((r) => r.title)).toEqual([
      'Blackbird',
      'Angie',
    ]);
  });

  it('needs-attention breaks a due-date tie by newest created first', () => {
    const rows = [
      makeRow({
        id: 'older',
        status: 'not_started',
        dueDate: FUTURE,
        createdAt: '2026-01-01T00:00:00Z',
      }),
      makeRow({
        id: 'newer',
        status: 'not_started',
        dueDate: FUTURE,
        createdAt: '2026-05-01T00:00:00Z',
      }),
    ];
    expect(sortAssignments(rows, defaults).map((r) => r.id)).toEqual(['newer', 'older']);
  });

  it('sorts by status weight (overdue first, cancelled last)', () => {
    const rows = [
      makeRow({ id: 'cancelled', status: 'cancelled' }),
      makeRow({ id: 'overdue', status: 'not_started', dueDate: PAST }),
      makeRow({ id: 'in_progress', status: 'in_progress' }),
    ];
    expect(sortAssignments(rows, { sort: 'status', dir: 'asc' }).map((r) => r.id)).toEqual([
      'overdue',
      'in_progress',
      'cancelled',
    ]);
    expect(sortAssignments(rows, { sort: 'status', dir: 'desc' }).map((r) => r.id)).toEqual([
      'cancelled',
      'in_progress',
      'overdue',
    ]);
  });

  it('sorts a legacy out-of-enum status last via the weight fallback', () => {
    // `deriveEffectiveStatus` casts the raw persisted status, and
    // `calculateAssignmentStatus` passes unknown values straight through — so a
    // legacy row (e.g. the retired 'pending') reaches STATUS_ORDER as a miss and
    // must fall back to weight 9 rather than NaN-poisoning the comparator.
    const legacyA = makeRow({ id: 'legacy-a', status: 'pending' });
    const legacyB = makeRow({ id: 'legacy-b', status: 'pending' });
    expect(legacyA.effectiveStatus).toBe('pending');

    // Two legacy rows so both comparator operands take the fallback; they tie at
    // weight 9 and keep their input order, and both sort after every known status.
    const rows = [legacyA, legacyB, makeRow({ id: 'cancelled', status: 'cancelled' })];
    expect(sortAssignments(rows, { sort: 'status', dir: 'asc' }).map((r) => r.id)).toEqual([
      'cancelled',
      'legacy-a',
      'legacy-b',
    ]);
  });

  it('sorts by created_at', () => {
    const rows = [
      makeRow({ id: 'newer', status: 'in_progress', createdAt: '2026-05-01T00:00:00Z' }),
      makeRow({ id: 'older', status: 'in_progress', createdAt: '2026-01-01T00:00:00Z' }),
    ];
    expect(sortAssignments(rows, { sort: 'created_at', dir: 'asc' }).map((r) => r.id)).toEqual([
      'older',
      'newer',
    ]);
  });

  it('sorts by updated_at', () => {
    const rows = [
      makeRow({ id: 'stale', status: 'in_progress', updatedAt: '2026-01-01T00:00:00Z' }),
      makeRow({ id: 'fresh', status: 'in_progress', updatedAt: '2026-05-01T00:00:00Z' }),
    ];
    expect(sortAssignments(rows, { sort: 'updated_at', dir: 'asc' }).map((r) => r.id)).toEqual([
      'stale',
      'fresh',
    ]);
  });

  it('sorts by due_date with undated rows last', () => {
    const rows = [
      makeRow({ id: 'nodue', status: 'in_progress' }),
      makeRow({ id: 'future', status: 'not_started', dueDate: FUTURE }),
      makeRow({ id: 'past', status: 'not_started', dueDate: PAST }),
    ];
    expect(sortAssignments(rows, { sort: 'due_date', dir: 'asc' }).map((r) => r.id)).toEqual([
      'past',
      'future',
      'nodue',
    ]);
  });
});

describe('buildAssignmentListResult', () => {
  const rows = [
    makeRow({ id: 'overdue', status: 'not_started', dueDate: PAST }), // effective overdue
    makeRow({ id: 'active', status: 'in_progress' }),
    makeRow({ id: 'done', status: 'completed' }),
  ];

  it('computes counts over ALL rows even when a tab filter is applied', () => {
    const result = buildAssignmentListResult(rows, { status: 'overdue', dir: 'asc' });
    expect(result.counts.all).toBe(3);
    expect(result.counts.overdue).toBe(1);
    // the Overdue tab shows only the past-due not_started row
    expect(result.rows.map((r) => r.id)).toEqual(['overdue']);
  });

  it('returns all rows when no tab filter is set', () => {
    const result = buildAssignmentListResult(rows, defaults);
    expect(result.rows).toHaveLength(3);
  });
});
