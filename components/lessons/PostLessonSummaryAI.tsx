'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Copy, Check } from 'lucide-react';
import { generatePostLessonSummaryStream } from '@/app/actions/ai';
import { useAIStream } from '@/hooks/useAIStream';
import { AIAssistButton } from '@/components/lessons/shared/AIAssistButton';
import { AIStreamingStatus } from '@/components/ai';
import { logger } from '@/lib/logger';

interface Props {
  studentName: string;
  studentId?: string;
  /** Lesson length in minutes. Optional — omitted when the lesson record has no duration. */
  duration?: number;
  songsPracticed: string[];
  newTechniques?: string[];
  struggles?: string[];
  successes?: string[];
  teacherNotes?: string;
  onSummaryGenerated?: (summary: string) => void;
}

export function PostLessonSummaryAI({
  studentName,
  studentId,
  duration,
  songsPracticed,
  newTechniques = [],
  struggles = [],
  successes = [],
  teacherNotes: _teacherNotes = '',
  onSummaryGenerated,
}: Props) {
  const [summary, setSummary] = useState('');
  const [copied, setCopied] = useState(false);

  // Streaming action wrapper
  const streamAction = useCallback(async function* (
    params: Record<string, unknown>,
    _signal?: AbortSignal
  ) {
    yield* await generatePostLessonSummaryStream(
      params as Parameters<typeof generatePostLessonSummaryStream>[0]
    );
  }, []);

  // AI streaming hook
  const aiStream = useAIStream(streamAction, {
    onChunk: (content) => {
      setSummary(content);
      onSummaryGenerated?.(content);
    },
    onError: (error) => {
      logger.error('[PostLessonSummaryAI] Streaming error:', error);
      const errorMsg = 'Error generating summary. Please try again.';
      setSummary(errorMsg);
      onSummaryGenerated?.(errorMsg);
    },
  });

  const handleGenerate = async () => {
    if (aiStream.isStreaming) return;

    setSummary(''); // Clear previous summary

    await aiStream.start({
      studentName,
      studentId,
      songTitle: songsPracticed.join(', '),
      lessonDuration: duration ? `${duration} minutes` : 'unspecified',
      skillsWorked: newTechniques.join(', '),
      challengesNoted: struggles.join(', '),
      nextSteps: successes.join(', '),
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      logger.error('Failed to copy summary:', error);
    }
  };

  const canGenerate = studentName && songsPracticed.length > 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          AI Post-Lesson Summary
        </CardTitle>
        <CardDescription>Generate a comprehensive lesson summary for {studentName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <AIAssistButton
            onClick={handleGenerate}
            disabled={!canGenerate}
            label="Generate Summary"
            status={aiStream.status}
            tokenCount={aiStream.tokenCount}
            onCancel={aiStream.cancel}
            className="w-full sm:w-auto"
          />
        </div>

        {/* Streaming Status */}
        {(aiStream.isStreaming || aiStream.isError) && (
          <AIStreamingStatus
            status={aiStream.status}
            tokenCount={aiStream.tokenCount}
            reasoning={aiStream.reasoning}
            error={aiStream.error}
            onCancel={aiStream.cancel}
            onRetry={() => {
              aiStream.reset();
              handleGenerate();
            }}
          />
        )}

        {summary && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">Generated Summary:</label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="flex items-center gap-2"
              >
                {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <Textarea value={summary} readOnly rows={8} className="resize-none bg-muted" />
          </div>
        )}

        {!canGenerate && (
          <p className="text-sm text-muted-foreground">
            Please ensure student name and songs practiced are provided to generate a summary.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
