'use client';

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { uploadSongCover, validateSongCoverFile } from '@/lib/storage/songCover';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid var(--rule)',
  borderRadius: 6,
  background: 'var(--paper)',
  fontFamily: 'var(--sans)',
  fontSize: 14,
  color: 'var(--ink)',
};

const buttonBase: React.CSSProperties = {
  borderRadius: 6,
  border: '1px solid var(--rule)',
  fontSize: 12,
  fontFamily: 'var(--mono)',
  whiteSpace: 'nowrap',
};

const removeButtonStyle: React.CSSProperties = {
  ...buttonBase,
  padding: '10px 12px',
  background: 'var(--paper)',
  color: 'var(--ink-3)',
  cursor: 'pointer',
};

const errorStyle: React.CSSProperties = {
  marginTop: 4,
  fontSize: 11,
  color: 'var(--danger)',
  fontFamily: 'var(--mono)',
};

type Props = {
  value: string | null;
  onChange: (url: string | null) => void;
  /** Present in the edit flow — makes the object path deterministic (overwrite). */
  songId?: string;
};

/**
 * Cover-image field for the editorial song forms. The resolved public URL lives
 * in the parent's controlled `value` (the parent carries it in a hidden
 * `cover_image_url` input and the live Preview). The URL text input stays
 * visible as a manual-entry fallback.
 *
 * File upload needs a Supabase Storage service. Stacks without one (the
 * StudentDevelopment stack has no storage-api container) set
 * NEXT_PUBLIC_SONG_COVER_UPLOAD_ENABLED=false to hide the button; the URL field
 * still works there.
 */
const isUploadEnabled = process.env.NEXT_PUBLIC_SONG_COVER_UPLOAD_ENABLED !== 'false';

export const SongFormEditorialCoverUpload = ({ value, onChange, songId }: Props) => {
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    const validation = validateSongCoverFile(file);
    if (!validation.valid) {
      setError(validation.error ?? 'Invalid file');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    try {
      const supabase = createClient();
      const result = await uploadSongCover(supabase, file, songId);
      if ('error' in result) setError(result.error);
      else onChange(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          type="url"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder="https://…"
          aria-label="Cover image URL"
          style={{ ...inputStyle, flex: 1 }}
        />
        {isUploadEnabled && (
          <label
            style={{
              ...buttonBase,
              padding: '10px 14px',
              background: 'var(--card)',
              cursor: isUploading ? 'wait' : 'pointer',
            }}
          >
            {isUploading ? 'Uploading…' : 'Upload image'}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleFileChange}
              disabled={isUploading}
              style={{ display: 'none' }}
            />
          </label>
        )}
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Remove cover image"
            style={removeButtonStyle}
          >
            Remove
          </button>
        )}
      </div>
      {error && (
        <div data-testid="song-cover-upload-error" style={errorStyle}>
          {error}
        </div>
      )}
    </div>
  );
};
