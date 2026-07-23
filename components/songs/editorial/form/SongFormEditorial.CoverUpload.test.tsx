/**
 * Component tests: SongFormEditorial.CoverUpload — the manual cover-image
 * uploader wired into the editorial song create + edit forms.
 *
 * Mocks the browser Supabase client and the storage helper; keeps the real
 * `validateSongCoverFile` so the client-side validation path is exercised.
 *
 * @see components/songs/editorial/form/SongFormEditorial.CoverUpload.tsx
 */

import { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { SongFormEditorialCoverUpload } from './SongFormEditorial.CoverUpload';
import { createClient } from '@/lib/supabase/client';
import { uploadSongCover } from '@/lib/storage/songCover';

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/storage/songCover', () => {
  const actual = jest.requireActual('@/lib/storage/songCover');
  return { ...actual, uploadSongCover: jest.fn() };
});

const mockCreateClient = createClient as jest.Mock;
const mockUploadSongCover = uploadSongCover as jest.Mock;

/** Stateful harness so onChange updates the rendered value like a real parent. */
function Harness({ initial = null, songId }: { initial?: string | null; songId?: string }) {
  const [value, setValue] = useState<string | null>(initial);
  return (
    <>
      <input type="hidden" name="cover_image_url" value={value ?? ''} readOnly />
      <SongFormEditorialCoverUpload value={value} onChange={setValue} songId={songId} />
    </>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockCreateClient.mockReturnValue({ storage: {} });
});

describe('SongFormEditorialCoverUpload', () => {
  it('uploads a selected image and reflects the new URL in the field', async () => {
    mockUploadSongCover.mockResolvedValue({ url: 'https://cdn.test/song-covers/new.png' });
    const { container } = render(<Harness songId="song-9" />);

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['bytes'], 'cover.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() =>
      expect(container.querySelector('input[type="url"]')).toHaveValue(
        'https://cdn.test/song-covers/new.png'
      )
    );
    expect(container.querySelector('input[name="cover_image_url"]')).toHaveValue(
      'https://cdn.test/song-covers/new.png'
    );
    expect(mockUploadSongCover).toHaveBeenCalledWith(expect.anything(), file, 'song-9');
  });

  it('shows a validation error for an unsupported file type without uploading', async () => {
    render(<Harness />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['nope'], 'notes.txt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() =>
      expect(screen.getByTestId('song-cover-upload-error')).toHaveTextContent(
        'Please choose a PNG, JPEG, WebP, or GIF image.'
      )
    );
    expect(mockUploadSongCover).not.toHaveBeenCalled();
  });

  it('surfaces a storage error returned by the helper', async () => {
    mockUploadSongCover.mockResolvedValue({ error: 'Bucket not found' });
    render(<Harness />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['bytes'], 'cover.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() =>
      expect(screen.getByTestId('song-cover-upload-error')).toHaveTextContent('Bucket not found')
    );
  });

  it('lets the user type a manual URL, updating the bound value', () => {
    const { container } = render(<Harness />);

    const urlInput = container.querySelector('input[type="url"]') as HTMLInputElement;
    fireEvent.change(urlInput, { target: { value: 'https://manual.test/cover.jpg' } });

    expect(container.querySelector('input[name="cover_image_url"]')).toHaveValue(
      'https://manual.test/cover.jpg'
    );
  });

  it('clears the value when Remove is clicked', () => {
    const { container } = render(<Harness initial="https://cdn.test/existing.png" />);

    fireEvent.click(screen.getByRole('button', { name: /remove cover image/i }));

    expect(container.querySelector('input[name="cover_image_url"]')).toHaveValue('');
  });
});
