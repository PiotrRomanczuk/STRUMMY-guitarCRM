'use client';

import { useCallback } from 'react';
import { generateSongNotesStream, enhanceSongNotesStream } from '@/app/actions/ai';
import { useAIStream } from '@/hooks/useAIStream';
import { AIAssistButton } from '@/components/lessons/shared/AIAssistButton';
import { AIStreamingStatus } from '@/components/ai';
import type { SongFormData } from './helpers';

interface Props {
  songData: Pick<
    SongFormData,
    'title' | 'author' | 'level' | 'key' | 'chords' | 'tempo' | 'strumming_pattern' | 'capo_fret'
  >;
  currentNotes: string;
  onNotesGenerated: (notes: string) => void;
  disabled?: boolean;
}

export function SongNotesAI({ songData, currentNotes, onNotesGenerated, disabled = false }: Props) {
  const songContext = {
    title: songData.title,
    author: songData.author,
    level: songData.level,
    key: songData.key,
    chords: songData.chords || undefined,
    tempo: songData.tempo,
    strumming_pattern: songData.strumming_pattern || undefined,
    capo_fret: songData.capo_fret,
  };

  // Generate from scratch
  const generateStream = useCallback(async function* (
    params: Record<string, unknown>,
    _signal?: AbortSignal
  ) {
    yield* await generateSongNotesStream(params as Parameters<typeof generateSongNotesStream>[0]);
  }, []);

  const generateAI = useAIStream(generateStream, {
    onChunk: (content) => onNotesGenerated(content),
    onError: () => onNotesGenerated('Error generating notes. Please try again.'),
  });

  // Enhance existing notes
  const enhanceStream = useCallback(async function* (
    params: Record<string, unknown>,
    _signal?: AbortSignal
  ) {
    yield* await enhanceSongNotesStream(params as Parameters<typeof enhanceSongNotesStream>[0]);
  }, []);

  const enhanceAI = useAIStream(enhanceStream, {
    onChunk: (content) => onNotesGenerated(content),
    onError: () => onNotesGenerated('Error enhancing notes. Please try again.'),
  });

  const isStreaming = generateAI.isStreaming || enhanceAI.isStreaming;
  const canGenerate = songData.title && songData.author && !disabled && !isStreaming;
  const hasNotes = currentNotes.trim().length > 0;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    onNotesGenerated('');
    await generateAI.start(songContext);
  };

  const handleEnhance = async () => {
    if (!canGenerate || !hasNotes) return;
    onNotesGenerated('');
    await enhanceAI.start({ roughNotes: currentNotes, ...songContext });
  };

  const activeStream = enhanceAI.isStreaming || enhanceAI.isError ? enhanceAI : generateAI;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {hasNotes && (
          <AIAssistButton
            onClick={handleEnhance}
            disabled={!canGenerate}
            label="Enhance"
            status={enhanceAI.status}
            tokenCount={enhanceAI.tokenCount}
            onCancel={enhanceAI.cancel}
          />
        )}
        <AIAssistButton
          onClick={handleGenerate}
          disabled={!canGenerate}
          label="Generate Song Notes"
          status={generateAI.status}
          tokenCount={generateAI.tokenCount}
          onCancel={generateAI.cancel}
        />
      </div>

      {(activeStream.isStreaming || activeStream.isError) && (
        <AIStreamingStatus
          status={activeStream.status}
          tokenCount={activeStream.tokenCount}
          reasoning={activeStream.reasoning}
          error={activeStream.error}
          onCancel={activeStream.cancel}
          onRetry={() => {
            activeStream.reset();
            if (activeStream === enhanceAI) handleEnhance();
            else handleGenerate();
          }}
        />
      )}
    </div>
  );
}
