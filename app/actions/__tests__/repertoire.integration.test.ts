/**
 * Integration tests: Repertoire + Self-Rating server actions.
 *
 * Covers auth checks, Zod validation, happy paths, edge cases (duplicate,
 * auto-timestamps, ownership), and DB error handling for all 7 exported
 * functions across repertoire.ts and self-rating.ts.
 *
 * @see app/actions/repertoire.ts
 * @see app/actions/self-rating.ts
 */

/* ---------- Mocks (BEFORE imports) ---------- */

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

jest.mock('@/lib/getUserWithRolesSSR', () => ({
  getUserWithRolesSSR: jest.fn().mockResolvedValue({
    user: { id: '00000000-cccc-4000-a000-000000000003' },
    isAdmin: false,
    isTeacher: false,
    isStudent: true,
    isParent: false,
    isDevelopment: false,
  }),
}));

jest.mock('@/lib/auth/test-account-guard', () => ({
  guardTestAccountMutation: jest.fn().mockReturnValue(null),
  assertNotTestAccount: jest.fn(),
}));

/* ---------- Imports ---------- */

import {
  createMockQueryBuilder,
  createMockAuthContext,
  MOCK_DATA_IDS,
} from '@/lib/testing/integration-helpers';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  getStudentRepertoireAction,
  addSongToRepertoireAction,
  updateRepertoireEntryAction,
  removeFromRepertoireAction,
  addSongToNextLessonAction,
  searchSongsForRepertoireAction,
} from '@/app/actions/repertoire';
import { updateSelfRatingAction } from '@/app/actions/self-rating';

/* ---------- Constants ---------- */

const teacherCtx = createMockAuthContext('teacher');
const studentCtx = createMockAuthContext('student');

const REPERTOIRE_ID = '00000000-4444-4000-a000-000000000040';
const SONG_ID = MOCK_DATA_IDS.song;
const LESSON_ID = MOCK_DATA_IDS.lesson;

/* ---------- Helpers ---------- */

/**
 * Extend a mock query builder with the `gt` method (not included in the
 * shared helper but required by addSongToNextLessonAction).
 */
function withGt(
  builder: ReturnType<typeof createMockQueryBuilder>
): ReturnType<typeof createMockQueryBuilder> {
  (builder as Record<string, jest.Mock>).gt = jest.fn().mockReturnValue(builder);
  return builder;
}

/**
 * Build a mock Supabase client where `from()` dispatches to per-table builders.
 */
function buildClient(
  user: { id: string; email: string } | null,
  tableMap: Record<string, ReturnType<typeof createMockQueryBuilder>>
) {
  const fallback = createMockQueryBuilder();
  const client = {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user },
        error: user ? null : { message: 'not authenticated' },
      }),
    },
    from: jest.fn((table: string) => tableMap[table] ?? fallback),
  };
  (createClient as jest.Mock).mockResolvedValue(client);
  return client;
}

/* ---------- Tests ---------- */

describe('getStudentRepertoireAction', () => {
  it('returns Unauthorized when user is null', async () => {
    buildClient(null, {});
    const result = await getStudentRepertoireAction(studentCtx.userId);
    expect(result).toEqual({ error: 'Unauthorized' });
  });

  it('returns repertoire data ordered by priority and sort_order', async () => {
    const rows = [
      {
        id: REPERTOIRE_ID,
        student_id: studentCtx.userId,
        song_id: SONG_ID,
        song: { id: SONG_ID, title: 'Wonderwall', author: 'Oasis' },
      },
    ];
    const qb = createMockQueryBuilder(rows);
    buildClient(teacherCtx.user, { student_repertoire: qb });

    const result = await getStudentRepertoireAction(studentCtx.userId);
    expect('data' in result && result.data).toHaveLength(1);
    expect(qb.order).toHaveBeenCalledWith('priority', { ascending: true });
  });

  it('unwraps array song join into single object', async () => {
    const rows = [
      {
        id: REPERTOIRE_ID,
        student_id: studentCtx.userId,
        song_id: SONG_ID,
        song: [{ id: SONG_ID, title: 'Hey Jude', author: 'The Beatles' }],
      },
    ];
    const qb = createMockQueryBuilder(rows);
    buildClient(teacherCtx.user, { student_repertoire: qb });

    const result = await getStudentRepertoireAction(studentCtx.userId);
    expect('data' in result && result.data[0].song).not.toBeInstanceOf(Array);
  });

  it('returns error message on DB failure', async () => {
    const qb = createMockQueryBuilder(null, { message: 'connection refused' });
    buildClient(teacherCtx.user, { student_repertoire: qb });

    const result = await getStudentRepertoireAction(studentCtx.userId);
    expect(result).toEqual({ error: 'connection refused' });
  });
});

describe('addSongToRepertoireAction', () => {
  const validInput = {
    student_id: studentCtx.userId,
    song_id: SONG_ID,
  };

  it('returns Unauthorized when user is null', async () => {
    buildClient(null, {});
    const result = await addSongToRepertoireAction(validInput);
    expect(result).toEqual({ error: 'Unauthorized' });
  });

  it('rejects invalid input (non-UUID student_id)', async () => {
    buildClient(teacherCtx.user, {});
    const result = await addSongToRepertoireAction({
      student_id: 'not-a-uuid',
      song_id: SONG_ID,
    });
    expect('error' in result).toBe(true);
  });

  it('inserts and returns the new repertoire id', async () => {
    const qb = createMockQueryBuilder({ id: REPERTOIRE_ID });
    buildClient(teacherCtx.user, { student_repertoire: qb });

    const result = await addSongToRepertoireAction(validInput);
    expect(result).toEqual({ success: true, id: REPERTOIRE_ID });
    expect(qb.insert).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith(
      `/dashboard/users/${studentCtx.userId}`
    );
  });

  it('defaults assigned_by to authenticated user id', async () => {
    const qb = createMockQueryBuilder({ id: REPERTOIRE_ID });
    buildClient(teacherCtx.user, { student_repertoire: qb });

    await addSongToRepertoireAction(validInput);
    const insertArg = qb.insert.mock.calls[0][0];
    expect(insertArg.assigned_by).toBe(teacherCtx.userId);
  });

  it('returns friendly message on duplicate (code 23505)', async () => {
    const qb = createMockQueryBuilder(null, {
      code: '23505',
      message: 'unique violation',
    });
    buildClient(teacherCtx.user, { student_repertoire: qb });

    const result = await addSongToRepertoireAction(validInput);
    expect(result).toEqual({
      error: 'This song is already in the student repertoire',
    });
  });

  it('returns raw error message for other DB errors', async () => {
    const qb = createMockQueryBuilder(null, {
      code: '42P01',
      message: 'relation does not exist',
    });
    buildClient(teacherCtx.user, { student_repertoire: qb });

    const result = await addSongToRepertoireAction(validInput);
    expect(result).toEqual({ error: 'relation does not exist' });
  });
});

describe('updateRepertoireEntryAction', () => {
  it('returns Unauthorized when user is null', async () => {
    buildClient(null, {});
    const result = await updateRepertoireEntryAction(REPERTOIRE_ID, {});
    expect(result).toEqual({ error: 'Unauthorized' });
  });

  it('rejects invalid capo_fret value (> 20)', async () => {
    buildClient(teacherCtx.user, {});
    const result = await updateRepertoireEntryAction(REPERTOIRE_ID, {
      capo_fret: 25,
    });
    expect('error' in result).toBe(true);
  });

  it('updates entry and revalidates path', async () => {
    const qb = createMockQueryBuilder({ student_id: studentCtx.userId });
    buildClient(teacherCtx.user, { student_repertoire: qb });

    const result = await updateRepertoireEntryAction(REPERTOIRE_ID, {
      teacher_notes: 'Focus on barre chords',
    });
    expect(result).toEqual({ success: true });
    expect(qb.update).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith(
      `/dashboard/users/${studentCtx.userId}`
    );
  });

  it('auto-sets started_at when status is started', async () => {
    const qb = createMockQueryBuilder({ student_id: studentCtx.userId });
    buildClient(teacherCtx.user, { student_repertoire: qb });

    const before = new Date().toISOString();
    await updateRepertoireEntryAction(REPERTOIRE_ID, {
      current_status: 'started',
    });
    const updateArg = qb.update.mock.calls[0][0];
    expect(updateArg.started_at).toBeDefined();
    expect(new Date(updateArg.started_at).getTime()).toBeGreaterThanOrEqual(
      new Date(before).getTime()
    );
  });

  it('auto-sets mastered_at when status is mastered', async () => {
    const qb = createMockQueryBuilder({ student_id: studentCtx.userId });
    buildClient(teacherCtx.user, { student_repertoire: qb });

    await updateRepertoireEntryAction(REPERTOIRE_ID, {
      current_status: 'mastered',
    });
    const updateArg = qb.update.mock.calls[0][0];
    expect(updateArg.mastered_at).toBeDefined();
  });

  it('returns not found when entry does not exist', async () => {
    const qb = createMockQueryBuilder(null, { message: 'not found' });
    buildClient(teacherCtx.user, { student_repertoire: qb });

    const result = await updateRepertoireEntryAction(REPERTOIRE_ID, {
      teacher_notes: 'test',
    });
    expect(result).toEqual({ error: 'Repertoire entry not found' });
  });
});

describe('removeFromRepertoireAction', () => {
  it('returns Unauthorized when user is null', async () => {
    buildClient(null, {});
    const result = await removeFromRepertoireAction(REPERTOIRE_ID);
    expect(result).toEqual({ error: 'Unauthorized' });
  });

  it('deletes entry and revalidates path', async () => {
    const qb = createMockQueryBuilder({ student_id: studentCtx.userId });
    // Override delete terminal resolution to return no error
    qb.then = jest.fn((resolve: (v: unknown) => void) =>
      resolve({ data: null, error: null, count: 0 })
    );
    buildClient(teacherCtx.user, { student_repertoire: qb });

    const result = await removeFromRepertoireAction(REPERTOIRE_ID);
    expect(result).toEqual({ success: true });
    expect(qb.delete).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith(
      `/dashboard/users/${studentCtx.userId}`
    );
  });

  it('returns error on DB failure', async () => {
    // First call (select) succeeds, second call (delete) fails
    const selectQb = createMockQueryBuilder({ student_id: studentCtx.userId });
    const deleteQb = createMockQueryBuilder(null, { message: 'FK violation' });

    let callCount = 0;
    const client = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: teacherCtx.user },
          error: null,
        }),
      },
      from: jest.fn(() => {
        callCount++;
        // First from() call is select, second is delete
        return callCount === 1 ? selectQb : deleteQb;
      }),
    };
    (createClient as jest.Mock).mockResolvedValue(client);

    const result = await removeFromRepertoireAction(REPERTOIRE_ID);
    expect(result).toEqual({ error: 'FK violation' });
  });
});

describe('addSongToNextLessonAction', () => {
  const scheduledAt = '2026-03-15T10:00:00.000Z';

  it('returns Unauthorized when user is null', async () => {
    buildClient(null, {});
    const result = await addSongToNextLessonAction(studentCtx.userId, SONG_ID);
    expect(result).toEqual({ error: 'Unauthorized' });
  });

  it('returns noLesson when no upcoming scheduled lesson exists', async () => {
    const lessonsQb = withGt(
      createMockQueryBuilder(null, { message: 'no rows' })
    );
    buildClient(teacherCtx.user, { lessons: lessonsQb });

    const result = await addSongToNextLessonAction(studentCtx.userId, SONG_ID);
    expect(result).toEqual({ noLesson: true });
  });

  it('returns alreadyInLesson when song is already linked', async () => {
    const lessonData = { id: LESSON_ID, scheduled_at: scheduledAt };
    const existingSongLink = { id: 'link-id' };

    // lessons -> returns lesson; lesson_songs -> first call returns existing link
    let _fromCallCount = 0;
    const lessonsQb = withGt(createMockQueryBuilder(lessonData));
    const lessonSongsQb = createMockQueryBuilder(existingSongLink);

    const client = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: teacherCtx.user },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        _fromCallCount++;
        if (table === 'lessons') return lessonsQb;
        return lessonSongsQb;
      }),
    };
    (createClient as jest.Mock).mockResolvedValue(client);

    const result = await addSongToNextLessonAction(studentCtx.userId, SONG_ID);
    expect(result).toEqual({
      alreadyInLesson: true,
      lessonId: LESSON_ID,
      scheduledAt,
    });
  });

  it('inserts song into next lesson and revalidates paths', async () => {
    const lessonData = { id: LESSON_ID, scheduled_at: scheduledAt };

    // lessons -> returns lesson; lesson_songs -> first call (check) returns null,
    // second call (insert) succeeds
    const lessonsQb = withGt(createMockQueryBuilder(lessonData));
    const checkQb = createMockQueryBuilder(null, null);
    // Override single to return null data (no existing link)
    checkQb.single = jest.fn().mockResolvedValue({ data: null, error: null });

    const insertQb = createMockQueryBuilder();
    insertQb.then = jest.fn((resolve: (v: unknown) => void) =>
      resolve({ data: null, error: null, count: 0 })
    );

    let lessonSongsCallCount = 0;
    const client = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: teacherCtx.user },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        if (table === 'lessons') return lessonsQb;
        lessonSongsCallCount++;
        return lessonSongsCallCount === 1 ? checkQb : insertQb;
      }),
    };
    (createClient as jest.Mock).mockResolvedValue(client);

    const result = await addSongToNextLessonAction(studentCtx.userId, SONG_ID);
    expect(result).toEqual({
      success: true,
      lessonId: LESSON_ID,
      scheduledAt,
    });
    expect(revalidatePath).toHaveBeenCalledWith(
      `/dashboard/users/${studentCtx.userId}`
    );
    expect(revalidatePath).toHaveBeenCalledWith(
      `/dashboard/lessons/${LESSON_ID}`
    );
  });
});

describe('searchSongsForRepertoireAction', () => {
  it('returns Unauthorized when user is null', async () => {
    buildClient(null, {});
    const result = await searchSongsForRepertoireAction('test', studentCtx.userId);
    expect(result).toEqual({ error: 'Unauthorized' });
  });

  it('excludes songs already in repertoire', async () => {
    const existingRepertoire = [{ song_id: SONG_ID }];
    const allSongs = [
      { id: SONG_ID, title: 'Already Added', author: 'A', level: null, key: null },
      { id: '00000000-5555-4000-a000-000000000050', title: 'New Song', author: 'B', level: null, key: null },
    ];

    const repertoireQb = createMockQueryBuilder(existingRepertoire);
    const songsQb = createMockQueryBuilder(allSongs);

    const client = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: teacherCtx.user },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        if (table === 'student_repertoire') return repertoireQb;
        return songsQb;
      }),
    };
    (createClient as jest.Mock).mockResolvedValue(client);

    const result = await searchSongsForRepertoireAction('Song', studentCtx.userId);
    expect('data' in result && result.data).toHaveLength(1);
    if ('data' in result) {
      expect(result.data[0].title).toBe('New Song');
    }
  });

  it('returns all songs when repertoire is empty', async () => {
    const songs = [
      { id: SONG_ID, title: 'Song A', author: 'X', level: 'beginner', key: 'C' },
    ];
    const repertoireQb = createMockQueryBuilder([]);
    const songsQb = createMockQueryBuilder(songs);

    const client = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: teacherCtx.user },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        if (table === 'student_repertoire') return repertoireQb;
        return songsQb;
      }),
    };
    (createClient as jest.Mock).mockResolvedValue(client);

    const result = await searchSongsForRepertoireAction('', studentCtx.userId);
    expect('data' in result && result.data).toHaveLength(1);
  });

  it('returns error on DB failure', async () => {
    const repertoireQb = createMockQueryBuilder([]);
    const songsQb = createMockQueryBuilder(null, { message: 'timeout' });

    const client = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: teacherCtx.user },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        if (table === 'student_repertoire') return repertoireQb;
        return songsQb;
      }),
    };
    (createClient as jest.Mock).mockResolvedValue(client);

    const result = await searchSongsForRepertoireAction('q', studentCtx.userId);
    expect(result).toEqual({ error: 'timeout' });
  });
});

describe('updateSelfRatingAction', () => {
  it('returns Unauthorized when user is null', async () => {
    buildClient(null, {});
    const result = await updateSelfRatingAction(REPERTOIRE_ID, 3);
    expect(result).toEqual({ error: 'Unauthorized' });
  });

  it('rejects invalid rating (out of 1-5 range)', async () => {
    buildClient(studentCtx.user, {});
    const result = await updateSelfRatingAction(REPERTOIRE_ID, 0);
    expect('error' in result).toBe(true);
  });

  it('rejects non-integer rating', async () => {
    buildClient(studentCtx.user, {});
    const result = await updateSelfRatingAction(REPERTOIRE_ID, 3.5);
    expect('error' in result).toBe(true);
  });

  it('rejects invalid repertoireId (non-UUID)', async () => {
    buildClient(studentCtx.user, {});
    const result = await updateSelfRatingAction('bad-id', 3);
    expect('error' in result).toBe(true);
  });

  it('blocks rating another student repertoire entry', async () => {
    // Entry belongs to teacher, but authenticated as student
    const qb = createMockQueryBuilder({ student_id: teacherCtx.userId });
    buildClient(studentCtx.user, { student_repertoire: qb });

    const result = await updateSelfRatingAction(REPERTOIRE_ID, 4);
    expect(result).toEqual({
      error: 'You can only rate your own repertoire songs',
    });
  });

  it('returns not found when entry does not exist', async () => {
    const qb = createMockQueryBuilder(null, { message: 'no rows' });
    buildClient(studentCtx.user, { student_repertoire: qb });

    const result = await updateSelfRatingAction(REPERTOIRE_ID, 3);
    expect(result).toEqual({ error: 'Repertoire entry not found' });
  });

  it('updates self_rating and self_rating_updated_at on success', async () => {
    // First call: select (ownership check), second call: update
    const selectQb = createMockQueryBuilder({ student_id: studentCtx.userId });
    const updateQb = createMockQueryBuilder();
    updateQb.then = jest.fn((resolve: (v: unknown) => void) =>
      resolve({ data: null, error: null, count: 0 })
    );

    let callCount = 0;
    const client = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: studentCtx.user },
          error: null,
        }),
      },
      from: jest.fn(() => {
        callCount++;
        return callCount === 1 ? selectQb : updateQb;
      }),
    };
    (createClient as jest.Mock).mockResolvedValue(client);

    const result = await updateSelfRatingAction(REPERTOIRE_ID, 5);
    expect(result).toEqual({ success: true });
    expect(updateQb.update).toHaveBeenCalledWith(
      expect.objectContaining({
        self_rating: 5,
        self_rating_updated_at: expect.any(String),
      })
    );
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/repertoire');
    expect(revalidatePath).toHaveBeenCalledWith(
      `/dashboard/users/${studentCtx.userId}`
    );
  });

  it('returns error on update DB failure', async () => {
    const selectQb = createMockQueryBuilder({ student_id: studentCtx.userId });
    const updateQb = createMockQueryBuilder(null, {
      message: 'permission denied',
    });

    let callCount = 0;
    const client = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: studentCtx.user },
          error: null,
        }),
      },
      from: jest.fn(() => {
        callCount++;
        return callCount === 1 ? selectQb : updateQb;
      }),
    };
    (createClient as jest.Mock).mockResolvedValue(client);

    const result = await updateSelfRatingAction(REPERTOIRE_ID, 4);
    expect(result).toEqual({ error: 'permission denied' });
  });
});
