import { validateSongCoverFile, songCoverObjectPath, uploadSongCover } from '../songCover';

describe('validateSongCoverFile', () => {
  it('accepts a small PNG', () => {
    expect(validateSongCoverFile({ size: 500_000, type: 'image/png' })).toEqual({ valid: true });
  });

  it.each(['image/jpeg', 'image/webp', 'image/gif'])('accepts %s', (type) => {
    expect(validateSongCoverFile({ size: 1_000_000, type }).valid).toBe(true);
  });

  it('rejects a non-image file', () => {
    const result = validateSongCoverFile({ size: 100, type: 'application/pdf' });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/PNG, JPEG, WebP, or GIF/);
  });

  it('rejects a file over 2 MB', () => {
    const result = validateSongCoverFile({ size: 3 * 1024 * 1024, type: 'image/png' });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/2 MB/);
  });

  it('accepts a file exactly at the 2 MB boundary', () => {
    expect(validateSongCoverFile({ size: 2 * 1024 * 1024, type: 'image/png' }).valid).toBe(true);
  });
});

describe('songCoverObjectPath', () => {
  it('derives the extension from the mime type when songId is supplied', () => {
    expect(songCoverObjectPath('image/jpeg', 'song-123')).toBe('song-123/cover.jpg');
    expect(songCoverObjectPath('image/png', 'song-123')).toBe('song-123/cover.png');
    expect(songCoverObjectPath('image/webp', 'song-123')).toBe('song-123/cover.webp');
    expect(songCoverObjectPath('image/gif', 'song-123')).toBe('song-123/cover.gif');
  });

  it('falls back to png for an unknown mime type', () => {
    expect(songCoverObjectPath('image/tiff', 'song-123')).toBe('song-123/cover.png');
  });

  it('uses a random uuid at create time (no songId)', () => {
    const path = songCoverObjectPath('image/png');
    expect(path).toMatch(/^[0-9a-f-]{36}\.png$/);
  });
});

describe('uploadSongCover', () => {
  function mockSupabase(uploadError: { message: string } | null) {
    const upload = jest.fn().mockResolvedValue({ error: uploadError });
    const getPublicUrl = jest
      .fn()
      .mockReturnValue({ data: { publicUrl: 'https://example.test/song-covers/x.png' } });
    return {
      supabase: { storage: { from: jest.fn().mockReturnValue({ upload, getPublicUrl }) } },
      upload,
    };
  }

  it('rejects an invalid file before ever calling storage', async () => {
    const { supabase } = mockSupabase(null);
    const file = { name: 'doc.pdf', type: 'application/pdf', size: 100 } as File;

    const result = await uploadSongCover(supabase, file);

    expect(result).toEqual({ error: expect.stringMatching(/PNG, JPEG, WebP, or GIF/) });
    expect(supabase.storage.from).not.toHaveBeenCalled();
  });

  it('returns the public URL on a successful upload', async () => {
    const { supabase } = mockSupabase(null);
    const file = { name: 'cover.png', type: 'image/png', size: 1000 } as File;

    const result = await uploadSongCover(supabase, file);

    expect(result).toEqual({ url: 'https://example.test/song-covers/x.png' });
  });

  it('uploads to a deterministic path when a songId is supplied', async () => {
    const { supabase, upload } = mockSupabase(null);
    const file = { name: 'cover.jpg', type: 'image/jpeg', size: 1000 } as File;

    await uploadSongCover(supabase, file, 'song-42');

    expect(upload).toHaveBeenCalledWith(
      'song-42/cover.jpg',
      file,
      expect.objectContaining({ upsert: true, contentType: 'image/jpeg' })
    );
  });

  it('surfaces a storage error (e.g. no storage service running)', async () => {
    const { supabase } = mockSupabase({ message: 'Bucket not found' });
    const file = { name: 'cover.png', type: 'image/png', size: 1000 } as File;

    const result = await uploadSongCover(supabase, file);

    expect(result).toEqual({ error: 'Bucket not found' });
  });
});
