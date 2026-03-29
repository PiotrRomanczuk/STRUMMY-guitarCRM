/**
 * Zod schema for structured song normalization output.
 * Used with Vercel AI SDK's generateObject for reliable JSON responses.
 */

import { z } from 'zod';

export const songNormalizationSchema = z.object({
  normalizedTitle: z
    .string()
    .describe('Corrected song title with proper capitalization and punctuation'),
  normalizedArtist: z.string().describe('Corrected artist name'),
  alternativeTitles: z.array(z.string()).describe('Alternative title variations for search'),
  alternativeArtists: z.array(z.string()).describe('Alternative artist name variations'),
  confidence: z.number().min(0).max(100).describe('Confidence score 0-100'),
  reasoning: z.string().describe('Brief explanation of changes made'),
  searchQueries: z.array(z.string()).describe('Optimized search queries for Spotify API'),
  flags: z.object({
    hasFeaturing: z.boolean().describe('Contains featuring/collaboration credits'),
    hasTypos: z.boolean().describe('Original had spelling errors'),
    hasMissingWords: z.boolean().describe('Original was missing words'),
    hasSpecialCharacters: z.boolean().describe('Contains non-standard characters'),
    needsManualReview: z.boolean().describe('Requires human verification'),
  }),
});

export type SongNormalizationOutput = z.infer<typeof songNormalizationSchema>;

export const emailDraftSchema = z.object({
  subject: z.string().describe('Email subject line'),
  body: z.string().describe('Email body text'),
});

export type EmailDraftOutput = z.infer<typeof emailDraftSchema>;
