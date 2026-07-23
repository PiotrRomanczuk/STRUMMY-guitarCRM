/**
 * Song Form Server Action Tests
 *
 * Covers createSongAction: Zod validation, form-data coercion
 * (numbers, nullables), insert error handling, and redirect on success.
 *
 * @see app/actions/song-form.ts
 */

import { createSongAction, type SongFormState } from '../song-form';

const mockRedirect = jest.fn();
jest.mock('next/navigation', () => ({
  redirect: (path: string) => mockRedirect(path),
}));

const mockLoggerError = jest.fn();
jest.mock('@/lib/logger', () => ({
  logger: {
    error: (...args: unknown[]) => mockLoggerError(...args),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

type InsertResult = {
  data: { id: string } | null;
  error: { message: string; code: string } | null;
};

const mockInsert = jest.fn();
let mockInsertResult: InsertResult;

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      from: () => ({
        insert: (payload: unknown) => {
          mockInsert(payload);
          return {
            select: () => ({ single: () => Promise.resolve(mockInsertResult) }),
          };
        },
      }),
    })
  ),
}));

const emptyState: SongFormState = {};

function buildFormData(entries: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    formData.append(key, value);
  }
  return formData;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockInsertResult = { data: { id: 'song-1' }, error: null };
});

describe('createSongAction', () => {
  it('inserts a fully-populated song and redirects to its page', async () => {
    const formData = buildFormData({
      title: '  Wonderwall  ',
      author: 'Oasis',
      level: 'beginner',
      key: 'Am',
      capo_fret: '2',
      tempo: '87',
      chords: 'Em G D A',
      strumming_pattern: 'D D U - U D',
      notes: 'Strumming pattern: DDU UDU',
      lyrics_with_chords: '[Verse]\nEm       G\nToday is gonna be the day',
    });

    const result = await createSongAction(emptyState, formData);

    expect(result).toBeUndefined();
    expect(mockInsert).toHaveBeenCalledWith({
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
      notes: 'Strumming pattern: DDU UDU',
      lyrics_with_chords: '[Verse]\nEm       G\nToday is gonna be the day',
      category: null,
      youtube_url: null,
      spotify_link_url: null,
      ultimate_guitar_link: null,
      tiktok_short_url: null,
      cover_image_url: null,
      is_draft: false,
    });
    expect(mockRedirect).toHaveBeenCalledWith('/dashboard/songs/song-1');
  });

  it('coerces empty and non-numeric numbers plus blank text to null', async () => {
    const formData = buildFormData({
      title: 'Minimal',
      author: 'Anon',
      level: 'advanced',
      key: 'C',
      capo_fret: '', // empty string → null
      tempo: 'not-a-number', // NaN → null
      notes: '   ', // whitespace-only → null
      // chords omitted → null
    });

    await createSongAction(emptyState, formData);

    expect(mockInsert).toHaveBeenCalledWith({
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
      notes: null,
      lyrics_with_chords: null,
      category: null,
      youtube_url: null,
      spotify_link_url: null,
      ultimate_guitar_link: null,
      tiktok_short_url: null,
      cover_image_url: null,
      is_draft: false,
    });
  });

  it('treats absent numeric fields as null', async () => {
    const formData = buildFormData({
      title: 'Bare',
      author: 'Anon',
      level: 'intermediate',
      key: 'G',
    });

    await createSongAction(emptyState, formData);

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ capo_fret: null, tempo: null })
    );
  });

  it('returns field errors for an empty form without inserting', async () => {
    const result = await createSongAction(emptyState, new FormData());

    expect(result.errors).toBeDefined();
    expect(result.errors?.title).toBe('Title is required');
    expect(result.errors?.author).toBe('Author is required');
    expect(result.errors?.level).toBeDefined();
    expect(result.errors?.key).toBeDefined();
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('rejects out-of-range capo_fret and tempo', async () => {
    const formData = buildFormData({
      title: 'Range Test',
      author: 'Anon',
      level: 'beginner',
      key: 'D',
      capo_fret: '25',
      tempo: '400',
    });

    const result = await createSongAction(emptyState, formData);

    expect(result.errors?.capo_fret).toBeDefined();
    expect(result.errors?.tempo).toBeDefined();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('returns a form-level error and logs when the insert fails', async () => {
    mockInsertResult = {
      data: null,
      error: { message: 'permission denied', code: '42501' },
    };
    const formData = buildFormData({
      title: 'Blocked',
      author: 'Anon',
      level: 'beginner',
      key: 'E',
    });

    const result = await createSongAction(emptyState, formData);

    expect(result.errors?._form).toBe(
      'Could not save the song. Check your role permissions or try again.'
    );
    expect(mockLoggerError).toHaveBeenCalledWith('[song-form] insert error', {
      error: 'permission denied',
      code: '42501',
    });
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
