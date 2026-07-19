import { validateAvatarFile, avatarObjectPath, uploadAvatar } from '../avatar';

describe('validateAvatarFile (IDA-2)', () => {
  it('accepts a small PNG', () => {
    expect(validateAvatarFile({ size: 500_000, type: 'image/png' })).toEqual({ valid: true });
  });

  it.each(['image/jpeg', 'image/webp', 'image/gif'])('accepts %s', (type) => {
    expect(validateAvatarFile({ size: 1_000_000, type }).valid).toBe(true);
  });

  it('rejects a non-image file', () => {
    const result = validateAvatarFile({ size: 100, type: 'application/pdf' });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/PNG, JPEG, WebP, or GIF/);
  });

  it('rejects a file over 2 MB', () => {
    const result = validateAvatarFile({ size: 3 * 1024 * 1024, type: 'image/png' });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/2 MB/);
  });

  it('accepts a file exactly at the 2 MB boundary', () => {
    expect(validateAvatarFile({ size: 2 * 1024 * 1024, type: 'image/png' }).valid).toBe(true);
  });
});

describe('avatarObjectPath', () => {
  it('scopes the path to the user id, preserving the file extension', () => {
    expect(avatarObjectPath('user-123', 'photo.jpg')).toBe('user-123/avatar.jpg');
  });

  it('defaults to png when the file name has no extension', () => {
    expect(avatarObjectPath('user-123', 'photo')).toBe('user-123/avatar.png');
  });
});

describe('uploadAvatar', () => {
  function mockSupabase(uploadError: { message: string } | null) {
    return {
      storage: {
        from: jest.fn().mockReturnValue({
          upload: jest.fn().mockResolvedValue({ error: uploadError }),
          getPublicUrl: jest
            .fn()
            .mockReturnValue({
              data: { publicUrl: 'https://example.test/avatars/user-1/avatar.png' },
            }),
        }),
      },
    };
  }

  it('rejects an invalid file before ever calling storage', async () => {
    const supabase = mockSupabase(null);
    const file = { name: 'doc.pdf', type: 'application/pdf', size: 100 } as File;

    const result = await uploadAvatar(supabase, 'user-1', file);

    expect(result).toEqual({ error: expect.stringMatching(/PNG, JPEG, WebP, or GIF/) });
    expect(supabase.storage.from).not.toHaveBeenCalled();
  });

  it('returns the public URL on a successful upload', async () => {
    const supabase = mockSupabase(null);
    const file = { name: 'photo.png', type: 'image/png', size: 1000 } as File;

    const result = await uploadAvatar(supabase, 'user-1', file);

    expect(result).toEqual({ url: 'https://example.test/avatars/user-1/avatar.png' });
  });

  it('surfaces a storage error (e.g. no storage service running)', async () => {
    const supabase = mockSupabase({ message: 'Bucket not found' });
    const file = { name: 'photo.png', type: 'image/png', size: 1000 } as File;

    const result = await uploadAvatar(supabase, 'user-1', file);

    expect(result).toEqual({ error: 'Bucket not found' });
  });
});
