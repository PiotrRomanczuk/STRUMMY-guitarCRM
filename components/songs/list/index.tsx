import { createClient } from '@/lib/supabase/server';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { SongListClient } from './Client';
import { parseListParams } from './parseListParams';
import { transformRawSongs } from './transformSongs';

// Explicit columns for the song list query.
// Excludes search_vector (tsvector/unknown type) which is not needed in the UI
// and can cause serialization issues between server and client components.
const SONG_LIST_COLUMNS = `
  id, title, author, short_title, level, key,
  capo_fret, strumming_pattern, tempo, time_signature,
  duration_ms, release_year, category, chords,
  ultimate_guitar_link, youtube_url, spotify_link_url,
  cover_image_url, gallery_images, audio_files,
  is_draft, deleted_at, created_at, updated_at, tiktok_short_url,
  lesson_songs (
    id,
    status,
    lessons (
      id,
      student_id,
      profile:profiles!lessons_student_id_fkey (
        id,
        full_name
      )
    )
  )
`;

interface SongListProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function SongList({ searchParams }: SongListProps) {
  const { user, isAdmin, isTeacher } = await getUserWithRolesSSR();

  if (!user) {
    return <div data-testid="song-list-error">Not authenticated</div>;
  }

  const supabase = await createClient();
  const params = parseListParams(searchParams);

  // Lightweight query for dropdown options (all songs, 2 columns only)
  const { data: dropdownData } = await supabase.from('songs').select('category, author');
  const categories = [...new Set((dropdownData || []).map((s) => s.category).filter(Boolean))] as string[];
  categories.sort();
  const authors = [...new Set((dropdownData || []).map((s) => s.author).filter(Boolean))] as string[];
  authors.sort();

  // Build main query
  let songQuery = params.studentId
    ? supabase
        .from('songs')
        .select(
          `${SONG_LIST_COLUMNS}, lesson_songs!inner(id, status, lessons!inner(student_id))`,
          { count: 'exact' }
        )
        .eq('lesson_songs.lessons.student_id', params.studentId)
    : supabase.from('songs').select(SONG_LIST_COLUMNS, { count: 'exact' });

  if (params.search) {
    // Escape PostgREST special characters to prevent filter injection
    const escaped = params.search.replace(/[%_\\,.()"']/g, '');
    songQuery = songQuery.or(`title.ilike.%${escaped}%,author.ilike.%${escaped}%`);
  }
  if (params.level && params.level !== 'all') {
    songQuery = songQuery.eq('level', params.level);
  }
  if (params.key && params.key !== 'all') {
    songQuery = songQuery.eq('key', params.key);
  }
  if (params.category && params.category !== 'all') {
    songQuery = songQuery.eq('category', params.category);
  }
  if (params.author && params.author !== 'all') {
    songQuery = songQuery.eq('author', params.author);
  }
  if (!params.showDrafts) {
    songQuery = songQuery.or('is_draft.is.null,is_draft.eq.false');
  }

  // Server-side sort + pagination
  songQuery = songQuery.order(params.sortBy, { ascending: params.sortDir === 'asc' });
  const offset = (params.currentPage - 1) * params.pageSize;
  songQuery = songQuery.range(offset, offset + params.pageSize - 1);

  const { data: rawSongs, count, error } = await songQuery;

  if (error) {
    console.error('Error fetching songs:', error);
    return (
      <div data-testid="song-list-error">
        Something went wrong while loading songs. Please try again.
      </div>
    );
  }

  const totalCount = count ?? 0;
  const songs = transformRawSongs(rawSongs, params.studentId);

  // Fetch students for filter (only if admin or teacher)
  let students: { id: string; full_name: string | null; student_status: string | null }[] = [];
  if (isAdmin || isTeacher) {
    const { data: studentsData } = await supabase
      .from('profiles')
      .select('id, full_name, student_status')
      .eq('is_student', true)
      .order('full_name');
    students = studentsData || [];
  }

  return (
    <SongListClient
      initialSongs={songs}
      isAdmin={isAdmin || isTeacher}
      students={students}
      selectedStudentId={params.studentId}
      categories={categories}
      authors={authors}
      totalCount={totalCount}
      currentPage={params.currentPage}
      pageSize={params.pageSize}
    />
  );
}
