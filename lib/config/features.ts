/**
 * Frontend feature flags — progressive reveal of surfaces in the UI.
 *
 * These gate *visibility only*. Routes, server actions, and API endpoints stay
 * intact behind the scenes, so flipping a flag back to `true` restores the
 * feature everywhere it is referenced with no other changes.
 */

/**
 * Master switch for all AI-powered UI.
 *
 * When `false`, hides:
 *  - the "AI Assistant" and "AI Chat" sidebar items (see `menuConfig.ts`)
 *  - the in-form AI generators: lesson notes, song notes, assignment
 *    suggestions, and the post-lesson summary
 *
 * AI was briefly hidden 2026-07-20 to slim the app to the core teaching loop,
 * but verified live 2026-07-19 and kept visible as main moved on. Set to
 * `false` to hide the AI UI everywhere at once if it needs to come down again.
 */
export const SHOW_AI_FEATURES = true;
