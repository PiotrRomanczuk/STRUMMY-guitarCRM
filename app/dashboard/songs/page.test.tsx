import { render, screen } from '@testing-library/react';
import SongsPage from '@/app/dashboard/songs/page';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { getSongsForList } from '@/lib/services/songs-list-queries';
import { redirect } from 'next/navigation';

// This file used to test app/dashboard/songs/[id]/page.tsx (the old
// SongDetail/SongLessons/SongAssignments/SongStudents composition, gated by a
// redirect-to-sign-in check). That page has since been rewritten around a
// single SongDetailEditorial component with a notFound()-based 404 instead —
// none of the mocked behavior exists anymore. This file's name/location
// actually matches app/dashboard/songs/page.tsx (the editorial songs LIST
// page), which had no coverage at all, so the test now targets that page.
jest.mock('@/app/design-preview/editorial-tokens.css', () => ({}), { virtual: true });

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

jest.mock('@/lib/getUserWithRolesSSR', () => ({
  getUserWithRolesSSR: jest.fn(),
}));

jest.mock('@/lib/services/songs-list-queries', () => ({
  ...jest.requireActual('@/lib/services/songs-list-queries'),
  getSongsForList: jest.fn(),
}));

jest.mock('@/components/songs/editorial/SongsListEditorial', () => ({
  SongsListEditorial: ({
    songs,
    total,
    canCreate,
  }: {
    songs: { id: string; title: string }[];
    total: number;
    canCreate: boolean;
  }) => (
    <div data-testid="songs-list-editorial">
      <span data-testid="songs-total">{total}</span>
      <span data-testid="can-create">{String(canCreate)}</span>
      {songs.map((song) => (
        <span key={song.id} data-testid="song-title">
          {song.title}
        </span>
      ))}
    </div>
  ),
}));

const mockGetUserWithRolesSSR = getUserWithRolesSSR as jest.MockedFunction<
  typeof getUserWithRolesSSR
>;
const mockGetSongsForList = getSongsForList as jest.MockedFunction<typeof getSongsForList>;

const mockSongsResult = {
  songs: [{ id: 'song-1', title: 'Wonderwall' } as never],
  total: 1,
  page: 1,
  totalPages: 1,
  breakdown: { beginner: 1, intermediate: 0, advanced: 0, unset: 0 },
};

describe('SongsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to sign-in if no user', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: null,
      isAdmin: false,
      isTeacher: false,
      isStudent: false,
      isParent: false,
      isDevelopment: false,
    });

    try {
      await SongsPage({ searchParams: Promise.resolve({}) });
    } catch {
      // redirect throws in Next.js
    }

    expect(redirect).toHaveBeenCalledWith('/sign-in?redirect=/dashboard/songs');
  });

  it('renders the editorial songs list for an authorized user', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user: { id: 'admin-1', email: 'admin@example.com' } as any,
      isAdmin: true,
      isTeacher: false,
      isStudent: false,
      isParent: false,
      isDevelopment: false,
    });
    mockGetSongsForList.mockResolvedValue(mockSongsResult);

    const jsx = await SongsPage({ searchParams: Promise.resolve({}) });
    render(jsx);

    expect(screen.getByTestId('songs-list-editorial')).toBeInTheDocument();
    expect(screen.getByTestId('songs-total')).toHaveTextContent('1');
    expect(screen.getByTestId('can-create')).toHaveTextContent('true');
    expect(screen.getByTestId('song-title')).toHaveTextContent('Wonderwall');
  });

  it('denies create access to a student', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user: { id: 'student-1', email: 'student@example.com' } as any,
      isAdmin: false,
      isTeacher: false,
      isStudent: true,
      isParent: false,
      isDevelopment: false,
    });
    mockGetSongsForList.mockResolvedValue(mockSongsResult);

    const jsx = await SongsPage({ searchParams: Promise.resolve({}) });
    render(jsx);

    expect(screen.getByTestId('can-create')).toHaveTextContent('false');
  });

  it('parses search params into filters passed to getSongsForList', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user: { id: 'teacher-1', email: 'teacher@example.com' } as any,
      isAdmin: false,
      isTeacher: true,
      isStudent: false,
      isParent: false,
      isDevelopment: false,
    });
    mockGetSongsForList.mockResolvedValue(mockSongsResult);

    await SongsPage({
      searchParams: Promise.resolve({ level: 'beginner', search: 'wonder', sort: 'title' }),
    });

    expect(mockGetSongsForList).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'teacher-1' }),
      { isAdmin: false, isTeacher: true, isStudent: false },
      expect.objectContaining({ level: 'beginner', search: 'wonder', sort: 'title', page: 1 })
    );
  });
});
