/**
 * production-tab.test — SongDetailTabs renders ProductionTab for teacher/admin
 * and gates it behind canSeeProduction.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Stub out heavy children so the render stays fast.
jest.mock('@/components/songs/production/RecordingList', () => ({
  __esModule: true,
  default: ({ songId }: { songId: string }) => (
    <div data-testid="recording-list" data-song-id={songId} />
  ),
}));

jest.mock('@/components/songs/production/PostList', () => ({
  __esModule: true,
  default: ({ songId }: { songId: string }) => (
    <div data-testid="post-list" data-song-id={songId} />
  ),
}));

// PostFormDialog, PostMetricsForm, HashtagSetPicker are pulled in by PostList —
// mocked above so they won't render.

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
  usePathname: jest.fn(() => '/dashboard/songs/song-abc'),
}));

// Tanstack Query provider is not needed because PostList is mocked.
import { SongDetailTabs } from '@/components/songs/editorial/SongDetailTabs';

const SONG_ID = 'song-abc';
const OverviewStub = <div data-testid="overview-stub">Overview content</div>;

describe('SongDetailTabs', () => {
  it('shows the Overview tab by default', () => {
    render(<SongDetailTabs songId={SONG_ID} overview={OverviewStub} />);
    expect(screen.getByTestId('overview-stub')).toBeInTheDocument();
    expect(screen.queryByTestId('post-list')).not.toBeInTheDocument();
  });

  it.skip('switches to Production tab on click (skipped: tab hidden until /api/content/* ready)', () => {
    render(<SongDetailTabs songId={SONG_ID} overview={OverviewStub} />);
    fireEvent.click(screen.getByRole('tab', { name: /production/i }));
    expect(screen.getByTestId('post-list')).toBeInTheDocument();
    expect(screen.getByTestId('recording-list')).toBeInTheDocument();
    expect(screen.queryByTestId('overview-stub')).not.toBeInTheDocument();
  });

  it.skip('passes songId down to PostList (skipped: tab hidden until /api/content/* ready)', () => {
    render(<SongDetailTabs songId={SONG_ID} overview={OverviewStub} />);
    fireEvent.click(screen.getByRole('tab', { name: /production/i }));
    expect(screen.getByTestId('post-list')).toHaveAttribute('data-song-id', SONG_ID);
  });

  it.skip('switches back to Overview after visiting Production (skipped: tab hidden until /api/content/* ready)', () => {
    render(<SongDetailTabs songId={SONG_ID} overview={OverviewStub} />);
    fireEvent.click(screen.getByRole('tab', { name: /production/i }));
    fireEvent.click(screen.getByRole('tab', { name: /overview/i }));
    expect(screen.getByTestId('overview-stub')).toBeInTheDocument();
    expect(screen.queryByTestId('post-list')).not.toBeInTheDocument();
  });
});

describe('SongDetailEditorial — canSeeProduction gate', () => {
  // We test this at the editorial level to verify the guard prop is honoured.
  // Import lazily to keep this describe self-contained.

  it.skip('renders tabs (with Production) for teacher/admin (skipped: tab hidden until /api/content/* ready)', () => {
    // Re-import to get a fresh module graph.
    const { SongDetailTabs: Tabs } = jest.requireActual(
      '@/components/songs/editorial/SongDetailTabs'
    );
    render(<Tabs songId={SONG_ID} overview={OverviewStub} />);
    expect(screen.getByRole('tab', { name: /production/i })).toBeInTheDocument();
  });

  it('SongDetailEditorial omits tabs for students (canSeeProduction=false)', () => {
    // Mock the full editorial to keep it lightweight — we only need to verify
    // that the branch in SongDetailEditorial is followed.
    const { SongDetailEditorial } = jest.requireActual(
      '@/components/songs/editorial/SongDetailEditorial'
    );

    // Stub heavy child components
    jest.mock('@/components/songs/editorial/SongHeroEditorial', () => ({
      SongHeroEditorial: () => <div />,
    }));
    jest.mock('@/components/songs/editorial/SongChordsCardEditorial', () => ({
      SongChordsCardEditorial: () => <div />,
    }));
    jest.mock('@/components/songs/editorial/ComingSoonCard', () => ({
      ComingSoonCard: () => <div />,
    }));
    jest.mock('@/components/songs/editorial/SongSidebarEditorial', () => ({
      LearnersCard: () => <div />,
      RelatedCard: () => <div />,
      UsageCard: () => <div />,
    }));

    const minimalSong = {
      id: SONG_ID,
      title: 'Test Song',
      chords: null,
      level: null,
    };

    const { queryByRole } = render(
      <SongDetailEditorial
        song={minimalSong}
        stats={{ lessonCount: 0, uniqueStudents: 0 }}
        learners={[]}
        related={[]}
        canSeeProduction={false}
      />
    );

    expect(queryByRole('tab', { name: /production/i })).not.toBeInTheDocument();
  });
});
