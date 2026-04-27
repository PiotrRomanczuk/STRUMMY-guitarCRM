/**
 * Pure xlsx-row → typed-DTO parser.
 * Imported by both the runtime script and unit tests.
 */

import type { ProductionStatus } from '@/types/SongVideo';
import type { ContentPlatform, ContentPostStatus } from '@/types/ContentPost';

export interface SongDbRow {
  num: number | null;
  title: string;
  artist: string;
  genre: string | null;
  difficulty: string | null;
  technique: string | null;
  status: string | null;
  priority: string | null;
  notes: string | null;
}

export interface CalendarRow {
  date: string;
  day: string;
  time: string | null;
  song: string;
  hook: string | null;
  hashtags: string | null;
  story1: string | null;
  story2: string | null;
  story3: string | null;
  status: string | null;
  views: number | null;
  caption: string | null;
}

export interface PerformanceRow {
  date: string;
  song: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
}

export interface HashtagRow {
  hashtag: string;
  type: string | null;
  size: string | null;
  whenToUse: string | null;
}

const SONG_STATUS_TO_BUCKET: Record<string, string> = {
  '✅ DONE': 'done',
  DONE: 'done',
  '📅 MAY': 'may',
  MAY: 'may',
  '📅 JUNE': 'june',
  JUNE: 'june',
  '⏳ LATER': 'later',
  LATER: 'later',
  '⏳ BACKLOG': 'backlog',
  BACKLOG: 'backlog',
};

export function statusToPriorityBucket(raw: string | null): string | null {
  if (!raw) return null;
  return SONG_STATUS_TO_BUCKET[raw.trim()] ?? null;
}

const STATUS_TO_POST_STATUS: Record<string, ContentPostStatus> = {
  PLAN: 'planned',
  PLANNED: 'planned',
  RECORDED: 'scheduled',
  SCHEDULED: 'scheduled',
  POSTED: 'published',
  PUBLISHED: 'published',
  DONE: 'published',
};

export function calendarStatusToPostStatus(raw: string | null): ContentPostStatus {
  if (!raw) return 'planned';
  return STATUS_TO_POST_STATUS[raw.trim().toUpperCase()] ?? 'planned';
}

const STATUS_TO_PRODUCTION: Record<string, ProductionStatus> = {
  '✅ DONE': 'ready',
  '📅 MAY': 'idea',
  '📅 JUNE': 'idea',
  '⏳ LATER': 'idea',
  '⏳ BACKLOG': 'idea',
  RECORDED: 'edited',
  POSTED: 'ready',
  PLAN: 'idea',
};

export function statusToProductionStatus(raw: string | null): ProductionStatus {
  if (!raw) return 'idea';
  return STATUS_TO_PRODUCTION[raw.trim()] ?? 'idea';
}

/**
 * "5/1" → ISO date for the given target year.
 */
export function parseShortDate(raw: string, year: number): string | null {
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})/);
  if (!m) return null;
  const month = Number(m[1]);
  const day = Number(m[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
}

/**
 * "7PM" / "8 PM" / "19:00" → "HH:MM" 24h string.
 */
export function parseTimeOfDay(raw: string | null): string {
  if (!raw) return '19:00';
  const t = raw.trim().toUpperCase();
  const ampm = t.match(/^(\d{1,2})\s*(AM|PM)$/);
  if (ampm) {
    let h = Number(ampm[1]);
    const isPm = ampm[2] === 'PM';
    if (h === 12) h = isPm ? 12 : 0;
    else if (isPm) h += 12;
    return `${String(h).padStart(2, '0')}:00`;
  }
  const hm = t.match(/^(\d{1,2}):(\d{2})$/);
  if (hm) return `${hm[1].padStart(2, '0')}:${hm[2]}`;
  return '19:00';
}

export function combineDateTime(date: string, time: string): string {
  return new Date(`${date}T${time}:00.000Z`).toISOString();
}

export function pickPlatform(_song: string): ContentPlatform {
  // Excel doesn't differentiate platforms — the user posts cross-platform.
  // Default to TikTok (the primary channel for @JustMeAndGuitars).
  return 'tiktok';
}

export function splitHashtags(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

const ARTIST_ALIASES: Record<string, string> = {
  rhcp: 'red hot chili peppers',
  gnr: "guns n' roses",
  rem: 'r e m',
};

export function normalizeArtist(s: string): string {
  const lower = s
    .toLowerCase()
    .trim()
    .replace(/^the\s+/, '');
  return ARTIST_ALIASES[lower] ?? lower;
}

export function normalizeTitle(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[‘’`]/g, "'")
    .replace(/\(.*?\)/g, '')
    .replace(/\s+(solo|acoustic|unplugged)$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}
