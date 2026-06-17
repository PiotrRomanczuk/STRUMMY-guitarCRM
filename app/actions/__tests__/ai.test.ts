/**
 * AI Server Actions Tests
 *
 * Tests AI agent execution functions. Focuses on:
 * - Agent execution success/failure
 * - Error handling
 * - Model mapping
 *
 * Note: ai.ts functions require authentication (requireAuth)
 * Note: Streaming functions are thin wrappers, testing non-streaming versions
 *
 * @see app/actions/ai.ts
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { generateLessonNotes, generateAssignment, getAvailableModels } from '../ai';
import { getProviderAppropriateModel } from '../ai/shared';

// Mock AI provider
const mockGetAIProvider = jest.fn();
jest.mock('@/lib/ai', () => ({
  getAIProvider: () => mockGetAIProvider(),
  isAIError: (error: any) => error?.isAIError === true,
}));

// Mock model mappings
const mockMapToOllamaModel = jest.fn();
jest.mock('@/lib/ai/model-mappings', () => ({
  mapToOllamaModel: (model: string) => mockMapToOllamaModel(model),
}));

// Mock Supabase with auth
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        }),
      },
    })
  ),
}));

// Mock auth [BMS-107]
const mockRequireAIAuth = jest.fn();
jest.mock('@/lib/ai/auth', () => ({
  requireAIAuth: () => mockRequireAIAuth(),
  AIAuthError: class AIAuthError extends Error {
    code: string;
    status: number;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
      this.status = code === 'UNAUTHENTICATED' ? 401 : 403;
    }
  },
}));

// Mock rate limiter [BMS-108]
const mockCheckRateLimit = jest.fn();
jest.mock('@/lib/ai/rate-limiter', () => ({
  checkRateLimit: (...args: any[]) => mockCheckRateLimit(...args),
}));

// Mock agent execution functions
const mockGenerateLessonNotesAgent = jest.fn();
const mockGenerateAssignmentAgent = jest.fn();
const mockIsAgentSuccess = jest.fn();
const mockExtractAgentResult = jest.fn();
const mockFormatAgentError = jest.fn();

jest.mock('@/lib/ai/agent-execution', () => ({
  generateEmailDraftAgent: jest.fn(),
  generateLessonNotesAgent: (context: any) => mockGenerateLessonNotesAgent(context),
  generateAssignmentAgent: (context: any) => mockGenerateAssignmentAgent(context),
  generatePostLessonSummaryAgent: jest.fn(),
  analyzeStudentProgressAgent: jest.fn(),
  generateAdminInsightsAgent: jest.fn(),
  extractAgentResult: (result: any) => mockExtractAgentResult(result),
  formatAgentError: (error: any) => mockFormatAgentError(error),
  isAgentSuccess: (result: any) => mockIsAgentSuccess(result),
}));

// Default: authenticated admin user with rate limiting allowed
beforeEach(() => {
  mockRequireAIAuth.mockResolvedValue({
    id: 'test-user-id',
    role: 'admin',
    email: 'admin@test.com',
  });
  mockCheckRateLimit.mockResolvedValue({ allowed: true });
});

describe('getProviderAppropriateModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should map OpenRouter models to Ollama equivalents', async () => {
    const ollamaProvider = { name: 'Ollama' };
    mockMapToOllamaModel.mockReturnValue('llama3.2');

    const result = await getProviderAppropriateModel(ollamaProvider, 'meta-llama/llama-3.2-90b');

    expect(result).toBe('llama3.2');
    expect(mockMapToOllamaModel).toHaveBeenCalledWith('meta-llama/llama-3.2-90b');
  });

  it('should use original model for non-Ollama providers', async () => {
    const openRouterProvider = { name: 'OpenRouter' };

    const result = await getProviderAppropriateModel(
      openRouterProvider,
      'anthropic/claude-3.5-sonnet'
    );

    expect(result).toBe('anthropic/claude-3.5-sonnet');
    expect(mockMapToOllamaModel).not.toHaveBeenCalled();
  });
});

describe('getAvailableModels', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return models from AI provider', async () => {
    const mockModels = [
      { id: 'model-1', name: 'GPT-4' },
      { id: 'model-2', name: 'Claude 3' },
    ];

    mockGetAIProvider.mockResolvedValue({
      name: 'OpenRouter',
      listModels: jest.fn().mockResolvedValue(mockModels),
    });

    const result = await getAvailableModels();

    expect(result.models).toEqual(mockModels);
    expect(result.providerName).toBe('OpenRouter');
    expect(result.error).toBeUndefined();
  });

  it('should handle provider errors', async () => {
    mockGetAIProvider.mockRejectedValue(new Error('API error'));

    const result = await getAvailableModels();

    expect(result.models).toBeUndefined();
    expect(result.providerName).toBeUndefined();
    expect(result.error).toBe('API error');
  });

  it('should handle unknown error types', async () => {
    mockGetAIProvider.mockRejectedValue('String error');

    const result = await getAvailableModels();

    expect(result.models).toBeUndefined();
    expect(result.error).toBe('Failed to fetch available models.');
  });
});

describe('generateLessonNotes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate lesson notes successfully', async () => {
    mockGenerateLessonNotesAgent.mockResolvedValue({
      success: true,
      result: { content: 'Generated lesson notes' },
    });
    mockIsAgentSuccess.mockReturnValue(true);
    mockExtractAgentResult.mockReturnValue({ content: 'Generated lesson notes' });

    const params = {
      studentName: 'John Doe',
      songsCovered: ['Wonderwall', 'Blackbird'],
      lessonTopic: 'Chord progressions',
      duration: 60,
      teacherNotes: 'Great progress',
    };

    const result = await generateLessonNotes(params);

    expect(result.success).toBe(true);
    expect(result.notes).toBe('Generated lesson notes');
    expect(mockGenerateLessonNotesAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        student_name: 'John Doe',
        lesson_topic: 'Chord progressions',
        songs_covered: 'Wonderwall, Blackbird',
      })
    );
  });

  it('should handle agent failure', async () => {
    mockGenerateLessonNotesAgent.mockResolvedValue({
      success: false,
      error: 'AI service unavailable',
    });
    mockIsAgentSuccess.mockReturnValue(false);
    mockFormatAgentError.mockReturnValue('AI service unavailable');

    const result = await generateLessonNotes({
      studentName: 'John',
      songsCovered: [],
      lessonTopic: 'Test',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('AI service unavailable');
  });

  it('should handle unexpected errors', async () => {
    mockGenerateLessonNotesAgent.mockRejectedValue(new Error('Network timeout'));

    const result = await generateLessonNotes({
      studentName: 'John',
      songsCovered: [],
      lessonTopic: 'Test',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network timeout');
  });
});

describe('generateAssignment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate assignment successfully', async () => {
    mockGenerateAssignmentAgent.mockResolvedValue({
      success: true,
      result: { content: 'Practice C Major scale' },
    });
    mockIsAgentSuccess.mockReturnValue(true);
    mockExtractAgentResult.mockReturnValue({ content: 'Practice C Major scale' });

    const params = {
      studentName: 'Jane Doe',
      studentLevel: 'beginner' as const,
      recentSongs: ['Wonderwall'],
      focusArea: 'Scales',
      duration: '1 week',
    };

    const result = await generateAssignment(params);

    expect(result.success).toBe(true);
    expect(result.assignment).toBe('Practice C Major scale');
    expect(mockGenerateAssignmentAgent).toHaveBeenCalled();
  });

  it('should handle agent failure', async () => {
    mockGenerateAssignmentAgent.mockResolvedValue({
      success: false,
      error: 'Model overloaded',
    });
    mockIsAgentSuccess.mockReturnValue(false);
    mockFormatAgentError.mockReturnValue('Model overloaded');

    const result = await generateAssignment({
      studentName: 'Jane',
      studentLevel: 'beginner',
      recentSongs: [],
      focusArea: 'Test',
      duration: '1 week',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Model overloaded');
  });

  it('should handle empty recent songs', async () => {
    mockGenerateAssignmentAgent.mockResolvedValue({
      success: true,
      result: { content: 'General practice assignment' },
    });
    mockIsAgentSuccess.mockReturnValue(true);
    mockExtractAgentResult.mockReturnValue({ content: 'General practice assignment' });

    const result = await generateAssignment({
      studentName: 'Jane',
      studentLevel: 'intermediate',
      recentSongs: [], // Empty array
      focusArea: 'Technique',
      duration: '2 weeks',
    });

    expect(result.success).toBe(true);
    expect(mockGenerateAssignmentAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        song_title: '', // Should default to empty string
      })
    );
  });
});

describe('AI Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle null agent response', async () => {
    mockGenerateAssignmentAgent.mockResolvedValue(null);
    mockIsAgentSuccess.mockReturnValue(false);
    mockFormatAgentError.mockReturnValue('No response from agent');

    const result = await generateAssignment({
      studentName: 'Test',
      studentLevel: 'beginner',
      recentSongs: [],
      focusArea: 'Test',
      duration: '1 week',
    });

    expect(result.success).toBe(false);
  });

  it('should handle agent throwing exception', async () => {
    mockGenerateLessonNotesAgent.mockRejectedValue(new Error('Timeout'));

    const result = await generateLessonNotes({
      studentName: 'Test',
      songsCovered: [],
      lessonTopic: 'Test',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Timeout');
  });

  it('should handle non-Error exceptions', async () => {
    mockGenerateLessonNotesAgent.mockRejectedValue('String error');

    const result = await generateLessonNotes({
      studentName: 'Test',
      songsCovered: [],
      lessonTopic: 'Test',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to generate lesson notes');
  });
});

describe('Authentication enforcement [BMS-107]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue({ allowed: true });
  });

  it('should reject unauthenticated generateLessonNotes calls', async () => {
    mockRequireAIAuth.mockRejectedValue(new Error('Authentication required to use AI features.'));

    const result = await generateLessonNotes({
      studentName: 'Test',
      songsCovered: [],
      lessonTopic: 'Test',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Authentication required to use AI features.');
  });

  it('should reject unauthenticated generateAssignment calls', async () => {
    mockRequireAIAuth.mockRejectedValue(new Error('Authentication required to use AI features.'));

    const result = await generateAssignment({
      studentName: 'Test',
      studentLevel: 'beginner',
      recentSongs: [],
      focusArea: 'Test',
      duration: '1 week',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Authentication required to use AI features.');
  });

  it('should reject unauthenticated getAvailableModels calls', async () => {
    mockRequireAIAuth.mockRejectedValue(new Error('Authentication required to use AI features.'));

    const result = await getAvailableModels();

    expect(result.error).toBe('Authentication required to use AI features.');
  });
});

describe('Rate limiting enforcement [BMS-108]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAIAuth.mockResolvedValue({
      id: 'test-user-id',
      role: 'admin',
      email: 'admin@test.com',
    });
  });

  it('should reject rate-limited requests', async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: false, retryAfter: 30 });

    const result = await generateLessonNotes({
      studentName: 'Test',
      songsCovered: [],
      lessonTopic: 'Test',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Rate limit exceeded');
  });

  it('should pass user ID to rate limiter', async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: true });
    mockGenerateLessonNotesAgent.mockResolvedValue({ success: true, result: { content: 'ok' } });
    mockIsAgentSuccess.mockReturnValue(true);
    mockExtractAgentResult.mockReturnValue({ content: 'ok' });

    await generateLessonNotes({
      studentName: 'Test',
      songsCovered: [],
      lessonTopic: 'Test',
    });

    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      'test-user-id',
      'admin',
      'lesson-notes-assistant'
    );
  });
});
