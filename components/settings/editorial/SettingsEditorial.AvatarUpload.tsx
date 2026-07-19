'use client';

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { uploadAvatar, validateAvatarFile } from '@/lib/storage/avatar';

const editableInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid var(--rule)',
  borderRadius: 6,
  background: 'var(--paper)',
  fontFamily: 'var(--sans)',
  fontSize: 14,
  color: 'var(--ink)',
};

type Props = {
  userId: string;
  initialUrl: string | null;
};

/**
 * IDA-2: file upload that resolves to a public avatar_url, submitted through
 * the parent's existing native form (a hidden text input named `avatar_url`
 * carries whatever this widget lands on — a fresh upload, or the untouched
 * initial value). The URL text input stays visible as a manual-entry
 * fallback, per the roadmap's own approach.
 */
export function AvatarUpload({ userId, initialUrl }: Props) {
  const [url, setUrl] = useState(initialUrl ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    const validation = validateAvatarFile(file);
    if (!validation.valid) {
      setError(validation.error ?? 'Invalid file');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    try {
      const supabase = createClient();
      const result = await uploadAvatar(supabase, userId, file);
      if ('error' in result) {
        setError(result.error);
      } else {
        setUrl(result.url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <input type="hidden" name="avatar_url" value={url} readOnly />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          style={{ ...editableInputStyle, flex: 1 }}
        />
        <label
          style={{
            padding: '10px 14px',
            borderRadius: 6,
            border: '1px solid var(--rule)',
            background: 'var(--card)',
            fontSize: 12,
            fontFamily: 'var(--mono)',
            cursor: isUploading ? 'wait' : 'pointer',
            whiteSpace: 'nowrap',
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
      </div>
      {error && (
        <div
          data-testid="avatar-upload-error"
          style={{ marginTop: 4, fontSize: 11, color: 'var(--danger)', fontFamily: 'var(--mono)' }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
