/**
 * Drafted by local Gemma (gemma3:12b), corrected: mock useAIStream (controls
 * streaming state) and the server actions; let the real child buttons render.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SongNotesAI } from '@/components/songs/form/SongNotesAI';

const mockStart = jest.fn();
const mockCancel = jest.fn();
jest.mock('@/hooks/useAIStream', () => ({
  useAIStream: jest.fn(() => ({
    status: 'idle',
    content: '',
    tokenCount: 0,
    error: null,
    reasoning: undefined,
    isStreaming: false,
    isError: false,
    start: mockStart,
    cancel: mockCancel,
    reset: jest.fn(),
  })),
}));

jest.mock('@/app/actions/ai', () => ({
  generateSongNotesStream: jest.fn(),
  enhanceSongNotesStream: jest.fn(),
}));

const songData = {
  title: 'Wonderwall',
  author: 'Oasis',
  level: 'beginner',
  key: 'C',
  chords: 'C G Am F',
  tempo: 90,
  strumming_pattern: 'DDU',
  capo_fret: 2,
} as never;

beforeEach(() => jest.clearAllMocks());

describe('SongNotesAI', () => {
  it('renders the generate button', () => {
    render(<SongNotesAI songData={songData} currentNotes="" onNotesGenerated={jest.fn()} />);
    expect(screen.getByText('Generate Song Notes')).toBeInTheDocument();
  });

  it('does not show the Enhance button when there are no notes', () => {
    render(<SongNotesAI songData={songData} currentNotes="" onNotesGenerated={jest.fn()} />);
    expect(screen.queryByText('Enhance')).not.toBeInTheDocument();
  });

  it('shows the Enhance button when notes exist', () => {
    render(
      <SongNotesAI songData={songData} currentNotes="some notes" onNotesGenerated={jest.fn()} />
    );
    expect(screen.getByText('Enhance')).toBeInTheDocument();
  });

  it('clears notes and starts streaming on generate', async () => {
    const onNotesGenerated = jest.fn();
    render(<SongNotesAI songData={songData} currentNotes="" onNotesGenerated={onNotesGenerated} />);
    fireEvent.click(screen.getByText('Generate Song Notes'));
    expect(onNotesGenerated).toHaveBeenCalledWith('');
    expect(mockStart).toHaveBeenCalled();
  });
});
