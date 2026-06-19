'use server';

import { executeAgentStream } from './shared';

/**
 * Generate song notes (teaching tips and practice suggestions) with streaming
 */
export async function* generateSongNotesStream(params: {
  title: string;
  author: string;
  level?: string;
  key?: string;
  chords?: string;
  tempo?: number | null;
  strumming_pattern?: string;
  capo_fret?: number | null;
}) {
  yield* executeAgentStream('song-notes-assistant', params, {}, undefined, 'song_notes');
}

/**
 * Enhance rough teacher notes into polished teaching content with streaming.
 * Driven by the `song-notes-enhancer` agent spec (single source of truth for the
 * prompt, model, and limits). The teacher's rough notes plus song details are
 * passed as input and injected into the user message via the agent runner.
 */
export async function* enhanceSongNotesStream(params: {
  roughNotes: string;
  title: string;
  author: string;
  level?: string;
  key?: string;
  chords?: string;
  tempo?: number | null;
  strumming_pattern?: string;
  capo_fret?: number | null;
}) {
  yield* executeAgentStream('song-notes-enhancer', params, {}, undefined, 'song_notes');
}
