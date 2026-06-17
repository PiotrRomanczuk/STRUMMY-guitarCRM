/**
 * AI Streaming Server Actions Tests
 *
 * Exercises the streaming paths (executeAgentStream + createAIStreamFromProvider
 * in ai/shared.ts, plus the direct-provider stream in ai/songs.ts and the chat
 * stream in ai/core.ts). Uses a provider WITHOUT completeStream() so the
 * fallback fake-streaming path runs deterministically.
 *
 * @see app/actions/ai/shared.ts
 * @see app/actions/ai/songs.ts
 * @see app/actions/ai/core.ts
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { generateSongNotesStream, enhanceSongNotesStream, generateAIResponseStream } from '../ai';

const mockProvider = {
  name: 'OpenRouter',
  isAvailable: jest.fn().mockResolvedValue(true),
  listModels: jest.fn().mockResolvedValue([]),
  complete: jest.fn().mockResolvedValue({ content: 'Generated notes' }),
  // intentionally NO completeStream → forces complete() + fake-stream fallback
};

const mockGetAIProvider = jest.fn();
jest.mock('@/lib/ai', () => ({
  getAIProvider: () => mockGetAIProvider(),
  isAIError: (e: any) => e?.isAIError === true,
}));

jest.mock('@/lib/ai/registry', () => ({
  getAgent: jest.fn(() => ({ model: 'test-model', temperature: 0.7, maxTokens: 500 })),
  prepareContext: jest.fn().mockResolvedValue({}),
  buildSystemPrompt: jest.fn(() => 'system prompt'),
  buildUserMessage: jest.fn(() => 'user message'),
}));

jest.mock('@/lib/ai/model-mappings', () => ({
  mapToOllamaModel: (m: string) => m,
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
      },
      from: jest.fn(() => ({ insert: jest.fn().mockResolvedValue({ error: null }) })),
    })
  ),
}));

const mockRequireAIAuth = jest.fn();
jest.mock('@/lib/ai/auth', () => ({ requireAIAuth: () => mockRequireAIAuth() }));

const mockCheckRateLimit = jest.fn();
jest.mock('@/lib/ai/rate-limiter', () => ({
  checkRateLimit: (...args: any[]) => mockCheckRateLimit(...args),
}));

jest.mock('@/lib/ai/agent-execution', () => ({
  generateChatResponseAgent: jest.fn(),
  generateLessonNotesAgent: jest.fn(),
  generateAssignmentAgent: jest.fn(),
  generateEmailDraftAgent: jest.fn(),
  generatePostLessonSummaryAgent: jest.fn(),
  analyzeStudentProgressAgent: jest.fn(),
  generateAdminInsightsAgent: jest.fn(),
  extractAgentResult: jest.fn(),
  formatAgentError: jest.fn(),
  isAgentSuccess: jest.fn(),
}));

jest.mock('../ai-conversations', () => ({
  getConversation: jest.fn(),
  saveConversationMessages: jest.fn().mockResolvedValue(undefined),
  trackAIUsage: jest.fn().mockResolvedValue(undefined),
}));

async function collect(gen: AsyncGenerator<string>): Promise<string[]> {
  const out: string[] = [];
  for await (const chunk of gen) out.push(chunk);
  return out;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetAIProvider.mockResolvedValue(mockProvider);
  mockProvider.isAvailable.mockResolvedValue(true);
  mockProvider.complete.mockResolvedValue({ content: 'Generated notes' });
  mockRequireAIAuth.mockResolvedValue({ id: 'u1', role: 'teacher' });
  mockCheckRateLimit.mockResolvedValue({ allowed: true });
  // Force the non-SDK provider path in generateAIResponseStream
  process.env.AI_USE_VERCEL_SDK = 'false';
});

describe('generateSongNotesStream (executeAgentStream path)', () => {
  it('streams agent output ending with the full content', async () => {
    const chunks = await collect(
      generateSongNotesStream({ title: 'Wonderwall', author: 'Oasis' }) as any
    );
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[chunks.length - 1]).toContain('Generated');
  });

  it('yields an error chunk when the agent is not found', async () => {
    const registry = jest.requireMock('@/lib/ai/registry');
    registry.getAgent.mockReturnValueOnce(undefined);
    const chunks = await collect(generateSongNotesStream({ title: 'X', author: 'Y' }) as any);
    expect(chunks.join('')).toContain("Agent 'song-notes-assistant' not found");
  });

  it('yields an error chunk when rate-limited', async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: false, retryAfter: 30 });
    const chunks = await collect(generateSongNotesStream({ title: 'X', author: 'Y' }) as any);
    expect(chunks.join('')).toContain('Rate limit exceeded');
  });
});

describe('enhanceSongNotesStream (direct provider stream)', () => {
  it('streams enhanced content', async () => {
    const chunks = await collect(
      enhanceSongNotesStream({
        roughNotes: 'play slow',
        title: 'Wonderwall',
        author: 'Oasis',
      }) as any
    );
    expect(chunks[chunks.length - 1]).toContain('Generated');
  });

  it('yields an error chunk when auth fails', async () => {
    mockRequireAIAuth.mockRejectedValue(new Error('Unauthorized'));
    const chunks = await collect(
      enhanceSongNotesStream({ roughNotes: 'x', title: 'T', author: 'A' }) as any
    );
    expect(chunks.join('')).toContain('Error: Unauthorized');
  });
});

describe('generateAIResponseStream (chat stream, non-SDK path)', () => {
  it('streams a chat response', async () => {
    const chunks = await collect(generateAIResponseStream('hello') as any);
    expect(chunks[chunks.length - 1]).toContain('Generated');
  });

  it('yields an error when the provider is unavailable', async () => {
    mockProvider.isAvailable.mockResolvedValue(false);
    const chunks = await collect(generateAIResponseStream('hello') as any);
    expect(chunks.join('')).toContain('is not available');
  });
});
