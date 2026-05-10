import {
  isNoOpNotesUpdate,
  findImportedConflict,
  lessonCreateIdempotencyKey,
} from '@/lib/utils/dedup';

describe('isNoOpNotesUpdate (notes:auto-save-no-double-write)', () => {
  it('returns true when payload is { notes: <unchanged> }', () => {
    expect(isNoOpNotesUpdate({ notes: 'hello' }, { notes: 'hello' })).toBe(true);
  });

  it('treats trailing whitespace as a match', () => {
    expect(isNoOpNotesUpdate({ notes: 'hello' }, { notes: 'hello\n' })).toBe(true);
    expect(isNoOpNotesUpdate({ notes: 'hello\n' }, { notes: 'hello' })).toBe(true);
  });

  it('returns false when notes actually changed', () => {
    expect(isNoOpNotesUpdate({ notes: 'old' }, { notes: 'new' })).toBe(false);
  });

  it('returns false when payload includes any field other than notes', () => {
    expect(isNoOpNotesUpdate({ notes: 'hello' }, { notes: 'hello', status: 'COMPLETED' })).toBe(
      false
    );
    expect(isNoOpNotesUpdate({ notes: 'hello' }, { title: 'x', notes: 'hello' })).toBe(false);
  });

  it('returns false when payload is empty (nothing to dedup)', () => {
    expect(isNoOpNotesUpdate({ notes: 'hello' }, {})).toBe(false);
  });

  it('returns false when current row is unavailable', () => {
    expect(isNoOpNotesUpdate(null, { notes: 'hello' })).toBe(false);
    expect(isNoOpNotesUpdate(undefined, { notes: 'hello' })).toBe(false);
  });

  it('treats null current notes as empty string', () => {
    expect(isNoOpNotesUpdate({ notes: null }, { notes: '' })).toBe(true);
    expect(isNoOpNotesUpdate({ notes: null }, { notes: 'something' })).toBe(false);
  });

  it('rejects payloads where notes is not a string or null', () => {
    expect(isNoOpNotesUpdate({ notes: 'hello' }, { notes: 123 as unknown })).toBe(false);
  });
});

describe('findImportedConflict (create-lesson:gcal-dedup)', () => {
  const SCHED = '2026-05-14T14:00:00.000Z';
  const STUDENT = 'student-1';

  it('returns the conflicting imported row for the same student+slot', () => {
    const rows = [{ id: 'A', scheduled_at: SCHED, student_id: STUDENT, is_imported: true }];
    const hit = findImportedConflict(rows, {
      student_id: STUDENT,
      scheduled_at: SCHED,
    });
    expect(hit?.id).toBe('A');
  });

  it('ignores rows that are NOT imported', () => {
    const rows = [{ id: 'A', scheduled_at: SCHED, student_id: STUDENT, is_imported: false }];
    expect(
      findImportedConflict(rows, {
        student_id: STUDENT,
        scheduled_at: SCHED,
      })
    ).toBeNull();
  });

  it('ignores imported rows for a different student', () => {
    const rows = [{ id: 'A', scheduled_at: SCHED, student_id: 'someone-else', is_imported: true }];
    expect(
      findImportedConflict(rows, {
        student_id: STUDENT,
        scheduled_at: SCHED,
      })
    ).toBeNull();
  });

  it('ignores imported rows at a different slot', () => {
    const rows = [
      {
        id: 'A',
        scheduled_at: '2026-05-14T15:00:00.000Z',
        student_id: STUDENT,
        is_imported: true,
      },
    ];
    expect(
      findImportedConflict(rows, {
        student_id: STUDENT,
        scheduled_at: SCHED,
      })
    ).toBeNull();
  });

  it('returns the first match when multiple imported rows collide', () => {
    const rows = [
      { id: 'A', scheduled_at: SCHED, student_id: STUDENT, is_imported: true },
      { id: 'B', scheduled_at: SCHED, student_id: STUDENT, is_imported: true },
    ];
    expect(
      findImportedConflict(rows, {
        student_id: STUDENT,
        scheduled_at: SCHED,
      })?.id
    ).toBe('A');
  });

  it('returns null for an empty candidate list', () => {
    expect(findImportedConflict([], { student_id: STUDENT, scheduled_at: SCHED })).toBeNull();
  });
});

describe('lessonCreateIdempotencyKey', () => {
  it('namespaces by user id so two users with the same client_request_id never collide', () => {
    const a = lessonCreateIdempotencyKey('user-1', 'req-1');
    const b = lessonCreateIdempotencyKey('user-2', 'req-1');
    expect(a).not.toBe(b);
  });

  it('is deterministic for the same inputs', () => {
    expect(lessonCreateIdempotencyKey('u', 'r')).toBe(lessonCreateIdempotencyKey('u', 'r'));
  });
});
