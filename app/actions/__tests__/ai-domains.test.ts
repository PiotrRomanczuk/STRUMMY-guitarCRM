/**
 * AI Domain Server Actions Tests
 *
 * Covers the per-domain non-streaming actions that were previously untested:
 * email draft, post-lesson summary, student progress, admin insights, and the
 * generic chat response. Mirrors the mock setup in ai.test.ts.
 *
 * @see app/actions/ai/email.ts
 * @see app/actions/ai/lessons.ts
 * @see app/actions/ai/students.ts
 * @see app/actions/ai/admin.ts
 * @see app/actions/ai/core.ts
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  generateEmailDraft,
  generatePostLessonSummary,
  analyzeStudentProgress,
  generateAdminInsights,
  generateAIResponse,
} from '../ai';

jest.mock('@/lib/ai', () => ({
  getAIProvider: jest.fn(),
  isAIError: (error: any) => error?.isAIError === true,
}));

jest.mock('@/lib/ai/model-mappings', () => ({
  mapToOllamaModel: (model: string) => model,
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        }),
      },
      from: jest.fn(() => ({ insert: jest.fn().mockResolvedValue({ error: null }) })),
    })
  ),
}));

const mockRequireAIAuth = jest.fn();
jest.mock('@/lib/ai/auth', () => ({
  requireAIAuth: () => mockRequireAIAuth(),
}));

const mockCheckRateLimit = jest.fn();
jest.mock('@/lib/ai/rate-limiter', () => ({
  checkRateLimit: (...args: any[]) => mockCheckRateLimit(...args),
}));

const mockEmailAgent = jest.fn();
const mockSummaryAgent = jest.fn();
const mockProgressAgent = jest.fn();
const mockAdminAgent = jest.fn();
const mockChatAgent = jest.fn();
const mockIsAgentSuccess = jest.fn();
const mockExtractAgentResult = jest.fn();
const mockFormatAgentError = jest.fn();

jest.mock('@/lib/ai/agent-execution', () => ({
  generateEmailDraftAgent: (ctx: any) => mockEmailAgent(ctx),
  generatePostLessonSummaryAgent: (ctx: any) => mockSummaryAgent(ctx),
  analyzeStudentProgressAgent: (ctx: any) => mockProgressAgent(ctx),
  generateAdminInsightsAgent: (ctx: any) => mockAdminAgent(ctx),
  generateChatResponseAgent: (ctx: any) => mockChatAgent(ctx),
  generateLessonNotesAgent: jest.fn(),
  generateAssignmentAgent: jest.fn(),
  extractAgentResult: (r: any) => mockExtractAgentResult(r),
  formatAgentError: (e: any) => mockFormatAgentError(e),
  isAgentSuccess: (r: any) => mockIsAgentSuccess(r),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockRequireAIAuth.mockResolvedValue({ id: 'test-user-id', role: 'admin', email: 'a@test.com' });
  mockCheckRateLimit.mockResolvedValue({ allowed: true });
  mockFormatAgentError.mockReturnValue('Agent failed');
});

describe('generateEmailDraft', () => {
  const params = {
    templateType: 'lesson_reminder' as const,
    studentName: 'Emma',
    context: { lesson_date: '2026-04-01' },
  };

  it('parses subject and body from agent content', async () => {
    mockEmailAgent.mockResolvedValue({ ok: true });
    mockIsAgentSuccess.mockReturnValue(true);
    mockExtractAgentResult.mockReturnValue({
      content: 'Subject: Lesson Tomorrow\n\nSee you then!',
    });

    const result = await generateEmailDraft(params);

    expect(result).toEqual({ success: true, subject: 'Lesson Tomorrow', body: 'See you then!' });
  });

  it('falls back to default subject when none present', async () => {
    mockEmailAgent.mockResolvedValue({ ok: true });
    mockIsAgentSuccess.mockReturnValue(true);
    mockExtractAgentResult.mockReturnValue({ content: 'Just the body, no subject line.' });

    const result = await generateEmailDraft(params);

    expect(result.success).toBe(true);
    expect(result.subject).toBe('Generated Email');
    expect(result.body).toBe('Just the body, no subject line.');
  });

  it('returns error on agent failure', async () => {
    mockEmailAgent.mockResolvedValue({ ok: false });
    mockIsAgentSuccess.mockReturnValue(false);

    const result = await generateEmailDraft(params);

    expect(result).toEqual({ success: false, subject: '', body: '', error: 'Agent failed' });
  });

  it('returns error when auth throws', async () => {
    mockRequireAIAuth.mockRejectedValue(new Error('Unauthorized'));
    const result = await generateEmailDraft(params);
    expect(result).toEqual({ success: false, subject: '', body: '', error: 'Unauthorized' });
  });
});

describe('generatePostLessonSummary', () => {
  const params = { studentName: 'Emma', duration: 30, songsPracticed: ['Wonderwall'] };

  it('returns summary on success', async () => {
    mockSummaryAgent.mockResolvedValue({ ok: true });
    mockIsAgentSuccess.mockReturnValue(true);
    mockExtractAgentResult.mockReturnValue({ content: 'Great session.' });

    const result = await generatePostLessonSummary(params);
    expect(result).toEqual({ success: true, summary: 'Great session.' });
  });

  it('returns error on agent failure', async () => {
    mockSummaryAgent.mockResolvedValue({ ok: false });
    mockIsAgentSuccess.mockReturnValue(false);

    const result = await generatePostLessonSummary(params);
    expect(result).toEqual({ success: false, summary: '', error: 'Agent failed' });
  });
});

describe('analyzeStudentProgress', () => {
  const params = { studentId: 'stu-1', timePeriod: 'last_month' };

  it('returns insights on success', async () => {
    mockProgressAgent.mockResolvedValue({ ok: true });
    mockIsAgentSuccess.mockReturnValue(true);
    mockExtractAgentResult.mockReturnValue({ content: 'Improving steadily.' });

    const result = await analyzeStudentProgress(params);
    expect(result).toEqual({ success: true, insights: 'Improving steadily.' });
  });

  it('returns error on agent failure', async () => {
    mockProgressAgent.mockResolvedValue({ ok: false });
    mockIsAgentSuccess.mockReturnValue(false);

    const result = await analyzeStudentProgress(params);
    expect(result).toEqual({ success: false, insights: '', error: 'Agent failed' });
  });
});

describe('generateAdminInsights', () => {
  const params = {
    totalStudents: 20,
    newStudents: 3,
    retentionRate: 0.9,
    avgLessons: 4,
    popularSongs: ['Wonderwall'],
  };

  it('returns insights on success', async () => {
    mockAdminAgent.mockResolvedValue({ ok: true });
    mockIsAgentSuccess.mockReturnValue(true);
    mockExtractAgentResult.mockReturnValue({ content: 'Retention is healthy.' });

    const result = await generateAdminInsights(params);
    expect(result).toEqual({ success: true, insights: 'Retention is healthy.' });
  });

  it('returns error on agent failure', async () => {
    mockAdminAgent.mockResolvedValue({ ok: false });
    mockIsAgentSuccess.mockReturnValue(false);

    const result = await generateAdminInsights(params);
    expect(result).toEqual({ success: false, insights: '', error: 'Agent failed' });
  });
});

describe('generateAIResponse', () => {
  it('returns content on success (object result)', async () => {
    mockChatAgent.mockResolvedValue({ ok: true });
    mockIsAgentSuccess.mockReturnValue(true);
    mockExtractAgentResult.mockReturnValue({ content: 'Hello there.' });

    const result = await generateAIResponse('hi');
    expect(result).toEqual({ content: 'Hello there.' });
  });

  it('returns content on success (string result)', async () => {
    mockChatAgent.mockResolvedValue({ ok: true });
    mockIsAgentSuccess.mockReturnValue(true);
    mockExtractAgentResult.mockReturnValue('Plain string reply');

    const result = await generateAIResponse('hi');
    expect(result).toEqual({ content: 'Plain string reply' });
  });

  it('returns error on agent failure', async () => {
    mockChatAgent.mockResolvedValue({ ok: false });
    mockIsAgentSuccess.mockReturnValue(false);

    const result = await generateAIResponse('hi');
    expect(result).toEqual({ error: 'Agent failed' });
  });

  it('returns error when rate-limited', async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: false, retryAfter: 60 });
    const result = await generateAIResponse('hi');
    expect(result.error).toContain('Rate limit exceeded');
  });
});
