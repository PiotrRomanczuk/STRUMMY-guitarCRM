'use server';

import { getAIProvider, type AIMessage } from '@/lib/ai';
import { DEFAULT_AI_MODEL } from '@/lib/ai-models';
import { requireAIAuth } from '@/lib/ai/auth';
import { logger } from '@/lib/logger';
import {
  executeAgentStream,
  enforceRateLimit,
  saveAIGeneration,
  getProviderAppropriateModel,
  createAIStreamFromProvider,
} from './shared';

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
 * Calls the AI provider directly — no agent registry needed.
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
  let fullContent = '';
  try {
    const user = await requireAIAuth();
    await enforceRateLimit(user, 'song-notes-assistant');

    const provider = await getAIProvider();
    const providerModel = await getProviderAppropriateModel(provider, DEFAULT_AI_MODEL);

    const songContext = [
      `Title: ${params.title}`,
      `Artist: ${params.author}`,
      params.level && `Difficulty: ${params.level}`,
      params.key && `Key: ${params.key}`,
      params.chords && `Chords: ${params.chords}`,
      params.tempo && `Tempo: ${params.tempo} BPM`,
      params.strumming_pattern && `Strumming pattern: ${params.strumming_pattern}`,
      params.capo_fret && `Capo: fret ${params.capo_fret}`,
    ]
      .filter(Boolean)
      .join('\n');

    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are an expert guitar teacher assistant. Expand a teacher's rough notes into polished teaching documentation.

INSTRUCTIONS:
- Preserve ALL ideas from the teacher's notes — do not omit anything
- Expand shorthand into full sentences with proper guitar terminology
- Organise into two sections: "Teaching Tips" and "Practice Suggestions"
- Add specific guitar detail where helpful (BPM targets, fret positions, technique names)
- Keep tone professional but encouraging
- Total length: 150–250 words`,
      },
      {
        role: 'user',
        content: `Song context:\n${songContext}\n\nTeacher's rough notes to enhance:\n${params.roughNotes}`,
      },
    ];

    for await (const chunk of createAIStreamFromProvider(provider, {
      model: providerModel,
      messages,
      temperature: 0.5,
      maxTokens: 600,
    })) {
      fullContent = chunk;
      yield chunk;
    }

    saveAIGeneration({
      generationType: 'song_notes',
      modelId: providerModel,
      provider: provider.name?.toLowerCase(),
      inputParams: params,
      outputContent: fullContent,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to enhance notes';
    logger.error('[AI] enhanceSongNotesStream error:', error);
    saveAIGeneration({
      generationType: 'song_notes',
      inputParams: params,
      outputContent: '',
      isSuccessful: false,
      errorMessage: errorMsg,
    });
    yield `Error: ${errorMsg}`;
  }
}
