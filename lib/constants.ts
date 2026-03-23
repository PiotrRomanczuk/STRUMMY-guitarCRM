/**
 * Application-wide constants
 *
 * Centralizes magic numbers and commonly used values
 * to make the codebase more maintainable.
 */

// =============================================================================
// TIMING CONSTANTS (in milliseconds)
// =============================================================================

/** Time to show success/feedback messages before auto-hiding */
export const UI_FEEDBACK_DURATION = 3000;

/** Time to show "copied to clipboard" feedback */
export const CLIPBOARD_FEEDBACK_DURATION = 2000;

/** Typing animation delay for landing page */
export const TYPING_ANIMATION_DELAY = 2000;

/** Default API request timeout */
export const API_TIMEOUT = 5000;

/** Extended timeout for database operations */
export const DB_CONNECTION_TIMEOUT = 10000;

/** Jest timeout for complex async tests */
export const JEST_ASYNC_TIMEOUT = 30000;

/** Polling interval for real-time data refresh */
export const POLLING_INTERVAL = 5000;

// =============================================================================
// PAGINATION DEFAULTS
// =============================================================================

/** Default number of items per page in lists */
export const DEFAULT_PAGE_SIZE = 20;

/** Maximum items allowed per page */
export const MAX_PAGE_SIZE = 100;

// =============================================================================
// VALIDATION LIMITS
// =============================================================================

/** Maximum title length for songs */
export const MAX_TITLE_LENGTH = 200;

/** Maximum author name length */
export const MAX_AUTHOR_LENGTH = 100;

/** Maximum short title length */
export const MAX_SHORT_TITLE_LENGTH = 50;

/** Maximum fret position for capo */
export const MAX_CAPO_FRET = 20;

/** Maximum tempo in BPM */
export const MAX_TEMPO = 300;

/** Year range for release year validation */
export const RELEASE_YEAR_MIN = 1500;
export const RELEASE_YEAR_MAX = 2100;

// =============================================================================
// API ROUTES (for consistency)
// =============================================================================

export const API_ROUTES = {
  // Songs
  SONG: '/api/song',
  SONG_BY_ID: (id: string) => `/api/song?id=${id}`,
  SONG_LESSONS: (id: string) => `/api/song/${id}/lessons`,
  SONG_ASSIGNMENTS: (id: string) => `/api/song/${id}/assignments`,

  // Lessons
  LESSONS: '/api/lessons',
  LESSON_BY_ID: (id: string) => `/api/lessons/${id}`,

  // Users
  USERS: '/api/users',
  USER_BY_ID: (id: string) => `/api/users/${id}`,

  // Assignments
  ASSIGNMENTS: '/api/assignments',
  ASSIGNMENT_BY_ID: (id: string) => `/api/assignments/${id}`,
} as const;

// =============================================================================
// ROLE CONSTANTS
// =============================================================================

export const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// =============================================================================
// SONG STATUS CONSTANTS
// =============================================================================

export const SONG_STATUS = {
  TO_LEARN: 'to_learn',
  STARTED: 'started',
  REMEMBERED: 'remembered',
  WITH_AUTHOR: 'with_author',
  MASTERED: 'mastered',
} as const;

export type SongStatus = (typeof SONG_STATUS)[keyof typeof SONG_STATUS];

/** Human-friendly display labels for song progress statuses. */
export const SONG_STATUS_LABELS: Record<SongStatus, string> = {
  to_learn: 'To Learn',
  started: 'Started',
  remembered: 'Remembered',
  with_author: 'Play Along',
  mastered: 'Mastered',
};

/** Descriptive tooltips explaining what each song progress status means. */
export const SONG_STATUS_DESCRIPTIONS: Record<SongStatus, string> = {
  to_learn: 'Song is queued — not started yet',
  started: 'Student has begun learning chords and structure',
  remembered: 'Can play from memory without looking at chords',
  with_author: 'Can play along with the original recording at full tempo',
  mastered: 'Performance-ready — clean, confident, and expressive',
};

// =============================================================================
// DIFFICULTY LEVELS
// =============================================================================

export const DIFFICULTY_LEVELS = {
  BEGINNER: 'beginner',
  EASY: 'easy',
  INTERMEDIATE: 'intermediate',
  HARD: 'hard',
  EXPERT: 'expert',
} as const;

export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[keyof typeof DIFFICULTY_LEVELS];
