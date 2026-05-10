/**
 * Integration test: create-lesson:atomic-with-songs
 *
 * If the song-attach step fails after the lesson row is inserted, the lesson
 * must be rolled back so the caller never sees a phantom lesson with zero
 * songs. The handler now wraps `addSongsToLesson` in try/catch and deletes
 * the just-created lesson on failure.
 */

jest.mock('@/lib/services/calendar-lesson-sync', () => ({
  syncLessonCreation: jest.fn().mockResolvedValue(undefined),
  syncLessonUpdate: jest.fn().mockResolvedValue(undefined),
  syncLessonDeletion: jest.fn().mockResolvedValue(undefined),
}));

const mockAddSongsToLesson = jest.fn();
jest.mock('@/app/api/lessons/utils', () => {
  const actual = jest.requireActual('@/app/api/lessons/utils');
  return {
    ...actual,
    addSongsToLesson: (...args: unknown[]) => mockAddSongsToLesson(...args),
  };
});

import { createLessonHandler } from '@/app/api/lessons/handlers';
import { createMockAuthContext, MOCK_DATA_IDS } from '@/lib/testing/integration-helpers';

const teacherCtx = createMockAuthContext('teacher');
const studentCtx = createMockAuthContext('student');

const validInput = {
  student_id: studentCtx.userId,
  teacher_id: teacherCtx.userId,
  title: 'Atomic test lesson',
  scheduled_at: '2026-03-01T15:00:00.000Z',
  date: '2026-03-01',
  start_time: '15:00',
  song_ids: ['aaaaaaaa-1111-4111-8111-111111111111', 'aaaaaaaa-2222-4222-8222-222222222222'],
};

/**
 * Build a supabase client mock where `from()` dispatches per-table:
 *  - profiles: validation lookups (teacher + student)
 *  - lessons: insert (success) and delete (rollback)
 */
function buildClient(opts: { insertedLesson: { id: string }; onLessonDelete?: jest.Mock }) {
  const teacherProfileSingle = jest
    .fn()
    .mockResolvedValue({ data: { id: teacherCtx.userId, is_teacher: true }, error: null });
  const studentProfileSingle = jest
    .fn()
    .mockResolvedValue({ data: { id: studentCtx.userId, is_student: true }, error: null });

  let profileCall = 0;
  const profilesBuilder = {
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => {
          profileCall++;
          return profileCall === 1 ? teacherProfileSingle() : studentProfileSingle();
        }),
      })),
    })),
  };

  const insertSingle = jest.fn().mockResolvedValue({ data: opts.insertedLesson, error: null });
  const insertSelect = jest.fn(() => ({ single: insertSingle }));
  const deleteEq = opts.onLessonDelete ?? jest.fn().mockResolvedValue({ error: null });

  const lessonsBuilder = {
    insert: jest.fn(() => ({ select: insertSelect })),
    delete: jest.fn(() => ({ eq: deleteEq })),
  };

  return {
    from: jest.fn((table: string) => {
      if (table === 'profiles') return profilesBuilder;
      return lessonsBuilder;
    }),
    deleteEq,
    lessonsBuilder,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('create-lesson:atomic-with-songs', () => {
  it('happy path: lesson + songs both succeed → 201, no rollback', async () => {
    const inserted = { id: MOCK_DATA_IDS.lesson, ...validInput };
    const client = buildClient({ insertedLesson: inserted });
    mockAddSongsToLesson.mockResolvedValueOnce(undefined);

    const result = await createLessonHandler(
      client as never,
      teacherCtx.user,
      teacherCtx.profileMapped,
      validInput
    );

    expect(result.status).toBe(201);
    expect(client.lessonsBuilder.delete).not.toHaveBeenCalled();
    expect(mockAddSongsToLesson).toHaveBeenCalledTimes(1);
  });

  it('song-attach failure rolls back the inserted lesson', async () => {
    const inserted = { id: MOCK_DATA_IDS.lesson };
    const client = buildClient({ insertedLesson: inserted });
    mockAddSongsToLesson.mockRejectedValueOnce(new Error('FK violation'));

    const result = await createLessonHandler(
      client as never,
      teacherCtx.user,
      teacherCtx.profileMapped,
      validInput
    );

    expect(result.status).toBe(500);
    expect(result.error).toMatch(/Lesson creation failed: FK violation/);
    expect(client.lessonsBuilder.delete).toHaveBeenCalledTimes(1);
    expect(client.deleteEq).toHaveBeenCalledWith('id', inserted.id);
  });

  it('no song_ids → no song-attach call, no rollback path triggered', async () => {
    const inserted = { id: MOCK_DATA_IDS.lesson };
    const client = buildClient({ insertedLesson: inserted });

    const { song_ids, ...inputNoSongs } = validInput;
    void song_ids;

    const result = await createLessonHandler(
      client as never,
      teacherCtx.user,
      teacherCtx.profileMapped,
      inputNoSongs
    );

    expect(result.status).toBe(201);
    expect(mockAddSongsToLesson).not.toHaveBeenCalled();
    expect(client.lessonsBuilder.delete).not.toHaveBeenCalled();
  });

  it('lesson insert failure does not call song-attach (early return preserved)', async () => {
    const teacherProfileSingle = jest
      .fn()
      .mockResolvedValue({ data: { id: teacherCtx.userId, is_teacher: true }, error: null });
    const studentProfileSingle = jest
      .fn()
      .mockResolvedValue({ data: { id: studentCtx.userId, is_student: true }, error: null });

    let profileCall = 0;
    const profilesBuilder = {
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => {
            profileCall++;
            return profileCall === 1 ? teacherProfileSingle() : studentProfileSingle();
          }),
        })),
      })),
    };
    const lessonsInsertSingle = jest
      .fn()
      .mockResolvedValue({ data: null, error: { message: 'permission denied' } });
    const lessonsBuilder = {
      insert: jest.fn(() => ({
        select: jest.fn(() => ({ single: lessonsInsertSingle })),
      })),
      delete: jest.fn(),
    };
    const client = {
      from: jest.fn((table: string) => (table === 'profiles' ? profilesBuilder : lessonsBuilder)),
    };

    const result = await createLessonHandler(
      client as never,
      teacherCtx.user,
      teacherCtx.profileMapped,
      validInput
    );

    expect(result.status).toBe(500);
    expect(result.error).toMatch(/permission denied/);
    expect(mockAddSongsToLesson).not.toHaveBeenCalled();
    expect(lessonsBuilder.delete).not.toHaveBeenCalled();
  });
});
