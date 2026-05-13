import {
  CreateSongVideoInputSchema,
  UpdateSongVideoInputSchema,
  UploadUrlRequestSchema,
} from '@/schemas/SongVideoSchema';

const VALID_MIME = 'video/mp4';
const FIVE_HUNDRED_MB = 500 * 1024 * 1024;

describe('CreateSongVideoInputSchema', () => {
  const valid = {
    google_drive_file_id: 'drive-file-id',
    filename: 'video.mp4',
    mime_type: VALID_MIME,
  };

  it('accepts the minimum required payload and applies defaults', () => {
    const parsed = CreateSongVideoInputSchema.parse(valid);
    expect(parsed.title).toBe('');
    expect(parsed.video_type).toBe('tutorial');
  });

  it.each(['video/mp4', 'video/quicktime', 'video/webm'])('accepts mime_type %s', (mime) => {
    expect(CreateSongVideoInputSchema.parse({ ...valid, mime_type: mime }).mime_type).toBe(mime);
  });

  it('rejects unsupported mime types', () => {
    expect(() =>
      CreateSongVideoInputSchema.parse({ ...valid, mime_type: 'video/x-msvideo' })
    ).toThrow();
  });

  it('rejects file_size_bytes above 500MB', () => {
    expect(() =>
      CreateSongVideoInputSchema.parse({
        ...valid,
        file_size_bytes: FIVE_HUNDRED_MB + 1,
      })
    ).toThrow();
  });

  it('accepts file_size_bytes at the 500MB ceiling', () => {
    expect(
      CreateSongVideoInputSchema.parse({
        ...valid,
        file_size_bytes: FIVE_HUNDRED_MB,
      }).file_size_bytes
    ).toBe(FIVE_HUNDRED_MB);
  });

  it('rejects an empty filename', () => {
    expect(() => CreateSongVideoInputSchema.parse({ ...valid, filename: '' })).toThrow(
      /Filename is required/
    );
  });

  it('rejects a non-URL thumbnail_url', () => {
    expect(() =>
      CreateSongVideoInputSchema.parse({
        ...valid,
        thumbnail_url: 'not a url',
      })
    ).toThrow();
  });

  it.each(['tutorial', 'short'])('accepts video_type %s', (vt) => {
    expect(CreateSongVideoInputSchema.parse({ ...valid, video_type: vt }).video_type).toBe(vt);
  });
});

describe('UpdateSongVideoInputSchema', () => {
  it('accepts an empty update', () => {
    expect(UpdateSongVideoInputSchema.parse({})).toEqual({});
  });

  it('allows nulling out optional fields', () => {
    const parsed = UpdateSongVideoInputSchema.parse({
      thumbnail_url: null,
      duration_seconds: null,
      mic_type: null,
    });
    expect(parsed.thumbnail_url).toBeNull();
    expect(parsed.duration_seconds).toBeNull();
    expect(parsed.mic_type).toBeNull();
  });

  it.each(['iphone', 'external'])('accepts mic_type %s', (mt) => {
    expect(UpdateSongVideoInputSchema.parse({ mic_type: mt }).mic_type).toBe(mt);
  });
});

describe('UploadUrlRequestSchema', () => {
  it('requires a positive file_size_bytes when provided', () => {
    expect(() =>
      UploadUrlRequestSchema.parse({
        filename: 'a.mp4',
        mime_type: VALID_MIME,
        file_size_bytes: 0,
      })
    ).toThrow();
  });
});
