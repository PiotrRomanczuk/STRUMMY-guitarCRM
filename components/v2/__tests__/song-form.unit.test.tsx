import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
      ..._rest
    }: {
      children?: React.ReactNode;
      className?: string;
      [key: string]: unknown;
    }) => (
      <div className={className} data-testid="motion-div">
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

// Mock SpotifySearch
jest.mock('@/components/songs/form/SpotifySearch', () => {
  return function MockSpotifySearch({ onSelect }: { onSelect: (track: unknown) => void }) {
    return (
      <div data-testid="spotify-search">
        <button
          type="button"
          data-testid="spotify-select-btn"
          onClick={() =>
            onSelect({
              id: 'spotify-123',
              name: 'Test Track',
              artist: 'Test Artist',
              url: 'https://open.spotify.com/track/123',
              image: 'https://example.com/img.jpg',
              release_date: '2024-01-15',
            })
          }
        >
          Select Track
        </button>
      </div>
    );
  };
});

// Mock CategoryCombobox
jest.mock('@/components/songs/form/CategoryCombobox', () => {
  return function MockCategoryCombobox({
    value,
    onChange,
  }: {
    value: string;
    error?: string;
    onChange: (v: string) => void;
    onBlur: () => void;
  }) {
    return (
      <select
        data-testid="category-combobox"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select category</option>
        <option value="pop">Pop</option>
        <option value="rock">Rock</option>
      </select>
    );
  };
});

// Mock useSongMutation
const mockSaveSong = jest.fn();
jest.mock('@/components/songs/form/useSongMutation', () => ({
  useSongMutation: ({ onSuccess }: { onSuccess: () => void }) => ({
    isSubmitting: false,
    saveSong: mockSaveSong.mockImplementation(async () => {
      onSuccess();
    }),
  }),
}));

// Mock shared StepWizardForm to render steps directly for easier testing
jest.mock('@/components/shared/StepWizardForm', () => {
  return function MockStepWizardForm({
    steps,
    formData: _formData,
    submitLabel,
  }: {
    steps: Array<{ label: string; content: React.ReactNode; requiredFields?: string[] }>;
    formData: Record<string, unknown>;
    errors: Record<string, string | undefined>;
    submitLabel?: string;
  }) {
    return (
      <div data-testid="step-wizard">
        {steps.map((step, i) => (
          <div key={i} data-testid={`step-${i}`}>
            <h3>{step.label}</h3>
            {step.content}
          </div>
        ))}
        <button type="submit" data-testid="submit-btn">
          {submitLabel || 'Save'}
        </button>
      </div>
    );
  };
});

import { SongFormV2 } from '@/components/v2/songs/SongForm';
import type { Song } from '@/schemas/SongSchema';

// ──────────────────────────────────────────────────────────────────────────────
// SongFormV2
// ──────────────────────────────────────────────────────────────────────────────
describe('SongFormV2', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders in create mode with "New Song" title', () => {
    render(<SongFormV2 mode="create" />);
    expect(screen.getByText('New Song')).toBeInTheDocument();
  });

  it('renders in edit mode with "Edit Song" title', () => {
    const mockSong = {
      id: '1',
      title: 'Wonderwall',
      author: 'Oasis',
      level: 'intermediate',
      key: 'C',
    } as Song;
    render(<SongFormV2 mode="edit" song={mockSong} />);
    expect(screen.getByText('Edit Song')).toBeInTheDocument();
  });

  it('renders with empty fields in create mode', () => {
    render(<SongFormV2 mode="create" />);
    // Title input should be empty
    const titleInput = screen.getByLabelText(/title/i);
    expect(titleInput).toHaveValue('');
    // Author input should be empty
    const authorInput = screen.getByLabelText(/author/i);
    expect(authorInput).toHaveValue('');
  });

  it('pre-populates fields in edit mode', () => {
    const mockSong = {
      id: '1',
      title: 'Wonderwall',
      author: 'Oasis',
      level: 'intermediate',
      key: 'G',
    } as Song;
    render(<SongFormV2 mode="edit" song={mockSong} />);
    const titleInput = screen.getByLabelText(/title/i);
    expect(titleInput).toHaveValue('Wonderwall');
    const authorInput = screen.getByLabelText(/author/i);
    expect(authorInput).toHaveValue('Oasis');
  });

  it('renders the step wizard with 3 steps', () => {
    render(<SongFormV2 mode="create" />);
    expect(screen.getByText('Essential Info')).toBeInTheDocument();
    expect(screen.getByText('Resources & Media')).toBeInTheDocument();
    expect(screen.getByText('Musical Details')).toBeInTheDocument();
  });

  it('renders Spotify search integration', () => {
    render(<SongFormV2 mode="create" />);
    expect(screen.getByTestId('spotify-search')).toBeInTheDocument();
  });

  it('fills title and author from Spotify selection', () => {
    render(<SongFormV2 mode="create" />);
    fireEvent.click(screen.getByTestId('spotify-select-btn'));
    const titleInput = screen.getByLabelText(/title/i);
    expect(titleInput).toHaveValue('Test Track');
    const authorInput = screen.getByLabelText(/author/i);
    expect(authorInput).toHaveValue('Test Artist');
  });

  it('renders submit button with correct label in create mode', () => {
    render(<SongFormV2 mode="create" />);
    expect(screen.getByTestId('submit-btn')).toHaveTextContent('Create Song');
  });

  it('renders submit button with correct label in edit mode', () => {
    const mockSong = { id: '1', title: 'Test', author: 'A' } as Song;
    render(<SongFormV2 mode="edit" song={mockSong} />);
    expect(screen.getByTestId('submit-btn')).toHaveTextContent('Save Changes');
  });

  it('updates form data when user types in title field', () => {
    render(<SongFormV2 mode="create" />);
    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'New Title' } });
    expect(titleInput).toHaveValue('New Title');
  });

  it('renders category combobox', () => {
    render(<SongFormV2 mode="create" />);
    expect(screen.getByTestId('category-combobox')).toBeInTheDocument();
  });
});
