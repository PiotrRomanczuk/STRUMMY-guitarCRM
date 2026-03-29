/**
 * Context Summarizer
 *
 * Transforms raw database rows into human-readable summaries
 * for injection into AI agent system prompts. Produces concise
 * narrative context instead of dumping raw JSON.
 */

interface LessonRow {
  id?: string;
  date?: string;
  created_at?: string;
  notes?: string;
  songs?: Array<{ title?: string; artist?: string }> | string;
  duration?: number;
}

interface StudentRow {
  id?: string;
  full_name?: string;
  email?: string;
  level?: string;
  created_at?: string;
}

interface AssignmentRow {
  id?: string;
  title?: string;
  description?: string;
  status?: string;
  due_date?: string;
  created_at?: string;
}

interface RepertoireRow {
  title?: string;
  artist?: string;
  status?: string;
  level?: string;
}

/**
 * Summarize a student's profile for agent context
 */
export function summarizeStudent(student: StudentRow | null): string {
  if (!student) return '';

  const parts: string[] = [];
  if (student.full_name) parts.push(`Student: ${student.full_name}`);
  if (student.level) parts.push(`Level: ${student.level}`);
  if (student.created_at) {
    const enrolled = new Date(student.created_at);
    const months = Math.round((Date.now() - enrolled.getTime()) / (30 * 24 * 60 * 60 * 1000));
    parts.push(`Enrolled: ${months} months ago`);
  }

  return parts.join('. ') + '.';
}

/**
 * Summarize lesson history into a readable narrative
 */
export function summarizeLessons(lessons: LessonRow[]): string {
  if (!lessons || lessons.length === 0) return 'No lesson history available.';

  const count = lessons.length;
  const sortedLessons = [...lessons].sort((a, b) => {
    const dateA = a.date || a.created_at || '';
    const dateB = b.date || b.created_at || '';
    return dateB.localeCompare(dateA);
  });

  const latest = sortedLessons[0];
  const latestDate = latest.date || latest.created_at || 'unknown date';

  const songSet = new Set<string>();
  for (const lesson of sortedLessons) {
    const songs = parseSongs(lesson.songs);
    for (const song of songs) {
      songSet.add(song);
    }
  }

  const parts = [
    `${count} lesson${count > 1 ? 's' : ''} on record`,
    `Most recent: ${formatDate(latestDate)}`,
  ];

  if (songSet.size > 0) {
    const songList = Array.from(songSet).slice(0, 5).join(', ');
    parts.push(
      `Songs covered: ${songList}${songSet.size > 5 ? ` (+${songSet.size - 5} more)` : ''}`
    );
  }

  return parts.join('. ') + '.';
}

/**
 * Summarize student repertoire (song list with statuses)
 */
export function summarizeRepertoire(repertoire: RepertoireRow[]): string {
  if (!repertoire || repertoire.length === 0) return 'No songs in repertoire.';

  const byStatus: Record<string, string[]> = {};
  for (const song of repertoire) {
    const status = song.status || 'unknown';
    if (!byStatus[status]) byStatus[status] = [];
    const label = song.title
      ? `${song.title}${song.artist ? ` (${song.artist})` : ''}`
      : 'Untitled';
    byStatus[status].push(label);
  }

  const parts: string[] = [`${repertoire.length} songs in repertoire`];
  for (const [status, songs] of Object.entries(byStatus)) {
    const list = songs.slice(0, 3).join(', ');
    const extra = songs.length > 3 ? ` +${songs.length - 3} more` : '';
    parts.push(`${capitalize(status)}: ${list}${extra}`);
  }

  return parts.join('. ') + '.';
}

/**
 * Summarize assignment history
 */
export function summarizeAssignments(assignments: AssignmentRow[]): string {
  if (!assignments || assignments.length === 0) return 'No assignments on record.';

  const completed = assignments.filter((a) => a.status === 'completed').length;
  const pending = assignments.filter((a) => a.status === 'pending' || a.status === 'active').length;

  return `${assignments.length} assignments total (${completed} completed, ${pending} active/pending).`;
}

/**
 * Build a comprehensive student context summary from all available data
 */
export function buildStudentContextSummary(context: Record<string, unknown>): string {
  const parts: string[] = [];

  if (context.currentStudent) {
    parts.push(summarizeStudent(context.currentStudent as StudentRow));
  }

  if (context.studentLessons || context.recentLessons || context.lessonHistory) {
    const lessons = (context.studentLessons ||
      context.recentLessons ||
      context.lessonHistory) as LessonRow[];
    if (Array.isArray(lessons)) {
      parts.push(summarizeLessons(lessons));
    }
  }

  if (context.studentRepertoire) {
    const repertoire = context.studentRepertoire as RepertoireRow[];
    if (Array.isArray(repertoire)) {
      parts.push(summarizeRepertoire(repertoire));
    }
  }

  if (context.studentAssignments || context.assignmentHistory) {
    const assignments = (context.studentAssignments ||
      context.assignmentHistory) as AssignmentRow[];
    if (Array.isArray(assignments)) {
      parts.push(summarizeAssignments(assignments));
    }
  }

  return parts.filter(Boolean).join('\n');
}

// --- Helpers ---

function parseSongs(songs: LessonRow['songs']): string[] {
  if (!songs) return [];
  if (typeof songs === 'string') {
    return songs
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (Array.isArray(songs)) {
    return songs
      .map((s) => (s.title ? `${s.title}${s.artist ? ` by ${s.artist}` : ''}` : ''))
      .filter(Boolean);
  }
  return [];
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
