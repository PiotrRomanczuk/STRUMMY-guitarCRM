import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  SongStatsTeaching,
  SongEngagement,
  MasteryFunnel,
  LevelBalance,
  KeyLevelCell,
} from '@/types/SongStatsEngagement';

interface RepertoireRow {
  student_id: string;
  current_status: string;
  is_active: boolean;
}

interface SongWithRelations {
  id: string;
  title: string;
  author: string | null;
  level: string | null;
  key: string | null;
  category: string | null;
  chords: string | null;
  tempo: number | null;
  youtube_url: string | null;
  student_repertoire: RepertoireRow[];
  lesson_songs: Array<{ lesson_id: string }>;
}

function healthScore(s: SongWithRelations): number {
  let score = 0;
  if (s.chords && s.chords.trim() !== '') score += 30;
  if (s.category && s.category.trim() !== '') score += 15;
  if (s.tempo && s.tempo > 0) score += 15;
  if (s.youtube_url) score += 15;
  if (s.key) score += 15;
  if (s.level) score += 10;
  return score;
}

function toEngagement(song: SongWithRelations): SongEngagement {
  const reps = song.student_repertoire ?? [];
  const lessons = song.lesson_songs ?? [];
  return {
    songId: song.id,
    title: song.title,
    author: song.author,
    level: song.level,
    key: song.key,
    category: song.category,
    totalStudents: new Set(reps.map((r) => r.student_id)).size,
    masteredCount: new Set(
      reps.filter((r) => r.current_status === 'mastered').map((r) => r.student_id)
    ).size,
    activeLearners: new Set(reps.filter((r) => r.is_active).map((r) => r.student_id)).size,
    lessonAppearances: new Set(lessons.map((l) => l.lesson_id)).size,
    healthScore: healthScore(song),
  };
}

function buildFunnel(rows: Array<{ current_status: string }>): MasteryFunnel {
  const f: MasteryFunnel = { toLearn: 0, started: 0, remembered: 0, withAuthor: 0, mastered: 0 };
  const map: Record<string, keyof MasteryFunnel> = {
    to_learn: 'toLearn',
    started: 'started',
    remembered: 'remembered',
    with_author: 'withAuthor',
    mastered: 'mastered',
  };
  for (const r of rows) {
    const k = map[r.current_status];
    if (k) f[k]++;
  }
  return f;
}

function buildLevelBalance(songs: SongWithRelations[]): LevelBalance[] {
  const m = new Map<string, { total: number; inUse: Set<string>; students: Set<string> }>();
  for (const s of songs) {
    const lvl = s.level ?? 'Unknown';
    if (!m.has(lvl)) m.set(lvl, { total: 0, inUse: new Set(), students: new Set() });
    const e = m.get(lvl)!;
    e.total++;
    const reps = s.student_repertoire ?? [];
    if (reps.length > 0) e.inUse.add(s.id);
    for (const r of reps) e.students.add(r.student_id);
  }
  const order = ['beginner', 'intermediate', 'advanced', 'Unknown'];
  return Array.from(m.entries())
    .sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))
    .map(([level, d]) => ({
      level,
      totalSongs: d.total,
      songsInUse: d.inUse.size,
      uniqueStudents: d.students.size,
    }));
}

function buildHeatmap(songs: SongWithRelations[]): KeyLevelCell[] {
  const m = new Map<string, { songCount: number; students: Set<string> }>();
  for (const s of songs) {
    const ck = `${s.level ?? 'Unknown'}|${s.key ?? 'Unknown'}`;
    if (!m.has(ck)) m.set(ck, { songCount: 0, students: new Set() });
    const cell = m.get(ck)!;
    cell.songCount++;
    for (const r of s.student_repertoire ?? []) cell.students.add(r.student_id);
  }
  return Array.from(m.entries()).map(([k, d]) => {
    const [level, key] = k.split('|');
    return { level, key, songCount: d.songCount, studentsLearning: d.students.size };
  });
}

export async function computeTeachingStats(supabase: SupabaseClient): Promise<SongStatsTeaching> {
  const [songsRes, repRes] = await Promise.all([
    supabase
      .from('songs')
      .select(
        'id, title, author, level, key, category, chords, tempo, youtube_url, student_repertoire(student_id, current_status, is_active), lesson_songs(lesson_id)'
      )
      .is('deleted_at', null),
    supabase.from('student_repertoire').select('current_status, student_id'),
  ]);

  const songs = (songsRes.data ?? []) as SongWithRelations[];
  const repRows = repRes.data ?? [];

  const engagements = songs.map(toEngagement);
  const funnel = buildFunnel(repRows);

  const popularity = [...engagements]
    .filter((e) => e.totalStudents > 0)
    .sort((a, b) => b.totalStudents - a.totalStudents)
    .slice(0, 30);

  const deadSongs = engagements
    .filter((e) => e.totalStudents === 0 && e.lessonAppearances === 0)
    .sort((a, b) => b.healthScore - a.healthScore);

  const songsInUse = engagements.filter((e) => e.totalStudents > 0).length;
  const uniqueStudents = new Set(repRows.map((r) => r.student_id)).size;
  const totalRep = repRows.length;

  return {
    popularity,
    deadSongs,
    masteryFunnel: funnel,
    levelBalance: buildLevelBalance(songs),
    keyLevelHeatmap: buildHeatmap(songs),
    summary: {
      totalSongs: songs.length,
      songsInUse,
      percentInUse: songs.length > 0 ? Math.round((songsInUse / songs.length) * 100) : 0,
      totalStudentsLearning: uniqueStudents,
      overallMasteryRate: totalRep > 0 ? Math.round((funnel.mastered / totalRep) * 1000) / 10 : 0,
    },
  };
}
