/**
 * AI server actions — barrel.
 *
 * The implementation was decomposed from a single 1140-LOC file into per-domain
 * modules under `./ai/`. This barrel preserves the original import surface
 * (`@/app/actions/ai`) so existing callers and tests need no changes. Each
 * domain module carries its own `'use server'` directive; shared internal
 * helpers live in `./ai/shared` (a plain module).
 */
export { generateAIResponseStream, generateAIResponse, getAvailableModels } from './ai/core';

// NOTE: `getProviderAppropriateModel` is an internal helper in ./ai/shared and is
// intentionally NOT re-exported here. ./ai/shared is a plain (non-'use server')
// module importing Node-only deps (pino, supabase/server); re-exporting it through
// this barrel pulls that module into client bundles (build error: process.stdout in
// the Edge/Browser runtime). Import from './ai/shared' directly in server code/tests.

export {
  generateLessonNotesStream,
  generateLessonNotes,
  generatePostLessonSummaryStream,
  generatePostLessonSummary,
} from './ai/lessons';

export { generateAssignmentStream, generateAssignment } from './ai/assignments';

export { generateEmailDraftStream, generateEmailDraft } from './ai/email';

export { analyzeStudentProgressStream, analyzeStudentProgress } from './ai/students';

export { generateSongNotesStream, enhanceSongNotesStream } from './ai/songs';

export { generateAdminInsightsStream, generateAdminInsights } from './ai/admin';
