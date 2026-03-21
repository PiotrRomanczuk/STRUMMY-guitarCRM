import { createAdminClient } from '@/lib/supabase/admin';
import { parseChordsColumn } from '@/lib/music-theory/chord-parser';
import { logger } from '@/lib/logger';

export interface SongSummary {
  id: string;
  title: string;
  author: string | null;
}

export interface SongDatabaseStats {
  totalSongs: number;
  coverage: {
    chords: number; // Percentage 0-100
    youtube: number; // Percentage 0-100
    ultimateGuitar: number; // Percentage 0-100
    galleryImages: number; // Percentage 0-100
  };
  counts: {
    withChords: number;
    withYoutube: number;
    withUltimateGuitar: number;
    withGalleryImages: number;
  };
  missing: {
    chords: SongSummary[];
    youtube: SongSummary[];
    ultimateGuitar: SongSummary[];
    galleryImages: SongSummary[];
  };
}

export async function getSongDatabaseStatistics(): Promise<SongDatabaseStats> {
  const supabase = createAdminClient();

  // Fetch only the columns needed for database statistics
  const { data: songs, error } = await supabase
    .from('songs')
    .select('id, title, author, chords, youtube_url, ultimate_guitar_link, gallery_images')
    .is('deleted_at', null)
    .order('title');

  if (error) {
    logger.error('Error fetching songs for analytics:', error);
    throw new Error(`Failed to fetch songs: ${error.message}`);
  }

  if (!songs) {
    return {
      totalSongs: 0,
      coverage: { chords: 0, youtube: 0, ultimateGuitar: 0, galleryImages: 0 },
      counts: { withChords: 0, withYoutube: 0, withUltimateGuitar: 0, withGalleryImages: 0 },
      missing: { chords: [], youtube: [], ultimateGuitar: [], galleryImages: [] },
    };
  }

  const totalSongs = songs.length;

  // Helper to check if a field is "present"
  const hasValue = (val: string | null | undefined) =>
    val !== null && val !== undefined && val.trim() !== '';
  const hasArrayValue = (val: string[] | null | undefined) =>
    val !== null && val !== undefined && val.length > 0;

  // Categorize songs
  const missingChords = songs.filter((s) => !hasValue(s.chords));
  const missingYoutube = songs.filter((s) => !hasValue(s.youtube_url));
  const missingUltimateGuitar = songs.filter((s) => !hasValue(s.ultimate_guitar_link));
  const missingGalleryImages = songs.filter((s) => !hasArrayValue(s.gallery_images));

  const withChordsCount = totalSongs - missingChords.length;
  const withYoutubeCount = totalSongs - missingYoutube.length;
  const withUltimateGuitarCount = totalSongs - missingUltimateGuitar.length;
  const withGalleryImagesCount = totalSongs - missingGalleryImages.length;

  // Calculate percentages
  const calculatePercentage = (count: number) =>
    totalSongs > 0 ? Math.round((count / totalSongs) * 100) : 0;

  // Map to simple objects for the report
  // title is NOT NULL in DB; narrow select infers string | null
  const mapToSummary = (s: { id: string; title: string | null; author: string | null }): SongSummary => ({
    id: s.id,
    title: s.title ?? '',
    author: s.author,
  });

  return {
    totalSongs,
    coverage: {
      chords: calculatePercentage(withChordsCount),
      youtube: calculatePercentage(withYoutubeCount),
      ultimateGuitar: calculatePercentage(withUltimateGuitarCount),
      galleryImages: calculatePercentage(withGalleryImagesCount),
    },
    counts: {
      withChords: withChordsCount,
      withYoutube: withYoutubeCount,
      withUltimateGuitar: withUltimateGuitarCount,
      withGalleryImages: withGalleryImagesCount,
    },
    missing: {
      chords: missingChords.map(mapToSummary),
      youtube: missingYoutube.map(mapToSummary),
      ultimateGuitar: missingUltimateGuitar.map(mapToSummary),
      galleryImages: missingGalleryImages.map(mapToSummary),
    },
  };
}

// --- Chord Coverage Stats ---

export interface ChordCoverageSong {
  id: string;
  title: string | null;
  author: string | null;
  chordCount: number;
}

export interface ChordCoverageTier {
  count: number;
  songs: ChordCoverageSong[];
}

export interface ChordCoverageStats {
  total: number;
  analyzable: ChordCoverageTier;
  missingKey: ChordCoverageTier;
  unparseable: ChordCoverageTier;
  missingChords: ChordCoverageTier;
}

export async function getChordCoverageStats(): Promise<ChordCoverageStats> {
  const supabase = createAdminClient();

  const { data: songs, error } = await supabase
    .from('songs')
    .select('id, title, author, key, chords')
    .is('deleted_at', null)
    .order('title');

  if (error) {
    throw new Error(`Failed to fetch songs for chord coverage: ${error.message}`);
  }

  const tiers: ChordCoverageStats = {
    total: songs?.length ?? 0,
    analyzable: { count: 0, songs: [] },
    missingKey: { count: 0, songs: [] },
    unparseable: { count: 0, songs: [] },
    missingChords: { count: 0, songs: [] },
  };

  for (const song of songs ?? []) {
    const hasChords = song.chords && song.chords.trim() !== '';
    if (!hasChords) {
      tiers.missingChords.count++;
      tiers.missingChords.songs.push({ id: song.id, title: song.title, author: song.author, chordCount: 0 });
      continue;
    }

    const parsed = parseChordsColumn(song.chords);
    if (parsed.length === 0) {
      tiers.unparseable.count++;
      tiers.unparseable.songs.push({ id: song.id, title: song.title, author: song.author, chordCount: 0 });
      continue;
    }

    const hasKey = song.key && song.key.trim() !== '';
    const entry: ChordCoverageSong = { id: song.id, title: song.title, author: song.author, chordCount: parsed.length };

    if (!hasKey) {
      tiers.missingKey.count++;
      tiers.missingKey.songs.push(entry);
    } else {
      tiers.analyzable.count++;
      tiers.analyzable.songs.push(entry);
    }
  }

  return tiers;
}
