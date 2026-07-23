/**
 * Song Edit Server Action Tests
 *
 * Covers updateSongAction: Zod validation (uuid id, enums, ranges),
 * form-data coercion, update error handling, and revalidate + redirect
 * on success.
 *
 * @see app/actions/song-edit.ts
 */

import { updateSongAction, type SongEditState } from '../song-edit';

const mockRedirect = jest.fn();
jest.mock('next/navigation', () => ({
  redirect: (path: string) => mockRedirect(path),
}));

const mockRevalidatePath = jest.fn();
jest.mock('next/cache', () => ({
  revalidatePath: (path: string) => mockRevalidatePath(path),
}));

const mockLoggerError = jest.fn();
jest.mock('@/lib/logger', () => ({
  logger: {
    error: (...args: unknown[]) => mockLoggerError(...args),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

type UpdateResult = { error: { message: string; code: string } | null };

const mockUpdate = jest.fn();
const mockEq = jest.fn();
let mockUpdateResult: UpdateResult;

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      from: () => ({
        update: (payload: unknown) => {
          mockUpdate(payload);
          return {
            eq: (field: string, value: string) => {
              mockEq(field, value);
              return Promise.resolve(mockUpdateResult);
            },
          };
        },
      }),
    })
  ),
}));

const SONG_ID = '550e8400-e29b-41d4-a716-446655440000';
const emptyState: SongEditState = {};

function buildFormData(entries: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    formData.append(key, value);
  }
  return formData;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUpdateResult = { error: null };
});

describe('updateSongAction', () => {
  it('updates the song, revalidates, and redirects on success', async () => {
    const formData = buildFormData({
      id: SONG_ID,
      title: '  Wonderwall  ',
      author: 'Oasis',
      level: 'beginner',
      key: 'Am',
      capo_fret: '2',
      tempo: '87',
      chords: 'Em G D A',
      strumming_pattern: 'D D U - U D',
      lyrics_with_chords: '[Verse]\nEm       G\nToday is gonna be the day',
    });

    const result = await updateSongAction(emptyState, formData);

    expect(result).toBeUndefined();
    expect(mockUpdate).toHaveBeenCalledWith({
      title: 'Wonderwall',
      author: 'Oasis',
      level: 'beginner',
      key: 'Am',
      capo_fret: 2,
      tempo: 87,
      time_signature: null,
      release_year: null,
      chords: 'Em G D A',
      strumming_pattern: 'D D U - U D',
      cover_image_url: null,
      category: null,
      youtube_url: null,
      spotify_link_url: null,
      ultimate_guitar_link: null,
      tiktok_short_url: null,
      lyrics_with_chords: '[Verse]\nEm       G\nToday is gonna be the day',
    });
    expect(mockEq).toHaveBeenCalledWith('id', SONG_ID);
    expect(mockRevalidatePath).toHaveBeenCalledWith(`/dashboard/songs/${SONG_ID}`);
    expect(mockRedirect).toHaveBeenCalledWith(`/dashboard/songs/${SONG_ID}`);
  });

  it('coerces empty/non-numeric numbers and blank text to null', async () => {
    const formData = buildFormData({
      id: SONG_ID,
      title: 'Minimal',
      author: 'Anon',
      level: 'advanced',
      key: 'C',
      capo_fret: '', // empty string → null
      tempo: 'not-a-number', // NaN → null
      chords: '   ', // whitespace-only → null
      // lyrics_with_chords omitted → null
    });

    await updateSongAction(emptyState, formData);

    expect(mockUpdate).toHaveBeenCalledWith({
      title: 'Minimal',
      author: 'Anon',
      level: 'advanced',
      key: 'C',
      capo_fret: null,
      tempo: null,
      time_signature: null,
      release_year: null,
      chords: null,
      strumming_pattern: null,
      cover_image_url: null,
      category: null,
      youtube_url: null,
      spotify_link_url: null,
      ultimate_guitar_link: null,
      tiktok_short_url: null,
      lyrics_with_chords: null,
    });
  });

  it('treats absent numeric fields as null', async () => {
    const formData = buildFormData({
      id: SONG_ID,
      title: 'Bare',
      author: 'Anon',
      level: 'intermediate',
      key: 'G',
    });

    await updateSongAction(emptyState, formData);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ capo_fret: null, tempo: null })
    );
  });

  it('returns field errors for an empty form without updating', async () => {
    const result = await updateSongAction(emptyState, new FormData());

    expect(result.errors).toBeDefined();
    expect(result.errors?.id).toBeDefined(); // '' is not a uuid
    expect(result.errors?.title).toBeDefined();
    expect(result.errors?.author).toBeDefined();
    expect(result.errors?.level).toBeDefined();
    expect(result.errors?.key).toBeDefined();
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('rejects out-of-range capo_fret and tempo', async () => {
    const formData = buildFormData({
      id: SONG_ID,
      title: 'Range Test',
      author: 'Anon',
      level: 'beginner',
      key: 'D',
      capo_fret: '25',
      tempo: '400',
    });

    const result = await updateSongAction(emptyState, formData);

    expect(result.errors?.capo_fret).toBeDefined();
    expect(result.errors?.tempo).toBeDefined();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('returns a form-level error and logs when the update fails', async () => {
    mockUpdateResult = { error: { message: 'permission denied', code: '42501' } };
    const formData = buildFormData({
      id: SONG_ID,
      title: 'Blocked',
      author: 'Anon',
      level: 'beginner',
      key: 'E',
    });

    const result = await updateSongAction(emptyState, formData);

    expect(result.errors?._form).toBe(
      'Could not save the song. Check your role permissions or try again.'
    );
    expect(mockLoggerError).toHaveBeenCalledWith('[song-edit] update error', {
      error: 'permission denied',
      code: '42501',
    });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
