/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * AI Agents Tests
 *
 * Tests for agent specifications and the agent registry system
 */

import {
  registerAllAgents,
  emailDraftAgent,
  lessonNotesAgent,
  assignmentGeneratorAgent,
  postLessonSummaryAgent,
  progressInsightsAgent,
  adminInsightsAgent,
  songNormalizationAgent,
  chatAssistantAgent,
  songNotesAgent,
  songNotesEnhancerAgent,
  communicationAgents,
  contentAgents,
  analyticsAgents,
  systemAgents,
  assistantAgents,
  songContentAgents,
} from './index';

import {
  registerAgent,
  getAgent,
  getAllAgents,
  getAvailableAgents,
  hasAgent,
  unregisterAgent,
  getRegistryStats,
  executeAgent,
} from '../registry';

import type { AgentContext } from '../registry';

// Mock the AI provider to avoid actual API calls
jest.mock('../provider-factory', () => ({
  getAIProvider: jest.fn(() => ({
    complete: jest.fn().mockResolvedValue({
      success: true,
      content: 'Mocked AI response',
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
    }),
    isAvailable: jest.fn().mockResolvedValue(true),
    listModels: jest.fn().mockResolvedValue([{ id: 'test-model', name: 'Test Model' }]),
    name: 'mock-provider',
  })),
}));

// Mock rate limiter to always allow
jest.mock('../rate-limiter', () => ({
  checkRateLimit: jest.fn().mockResolvedValue({
    allowed: true,
    remaining: 100,
    resetTime: Date.now() + 60000,
  }),
  clearAllRateLimits: jest.fn(),
}));

describe('AI Agents', () => {
  describe('Agent Specifications', () => {
    describe('emailDraftAgent', () => {
      it('should have correct id', () => {
        expect(emailDraftAgent.id).toBe('email-draft-generator');
      });

      it('should have proper name and description', () => {
        expect(emailDraftAgent.name).toBe('Email Draft Generator');
        expect(emailDraftAgent.description).toContain('email drafts');
      });

      it('should target admin and teacher users', () => {
        expect(emailDraftAgent.targetUsers).toContain('admin');
        expect(emailDraftAgent.targetUsers).toContain('teacher');
        expect(emailDraftAgent.targetUsers).not.toContain('student');
      });

      it('should have communication use cases', () => {
        expect(emailDraftAgent.useCases).toContainEqual(expect.stringContaining('reminder'));
        expect(emailDraftAgent.useCases).toContainEqual(expect.stringContaining('progress'));
      });

      it('should have reasonable temperature for emails', () => {
        expect(emailDraftAgent.temperature).toBeGreaterThanOrEqual(0.5);
        expect(emailDraftAgent.temperature).toBeLessThanOrEqual(1.0);
      });

      it('should have correct UI category', () => {
        expect(emailDraftAgent.uiConfig.category).toBe('communication');
      });

      it('should have email-related allowed fields', () => {
        expect(emailDraftAgent.inputValidation.allowedFields).toContain('student_name');
        expect(emailDraftAgent.inputValidation.allowedFields).toContain('template_type');
      });

      it('should have logging enabled', () => {
        expect(emailDraftAgent.enableLogging).toBe(true);
      });

      it('should include student-scoped context keys', () => {
        expect(emailDraftAgent.optionalContext).toContain('studentLessons');
        expect(emailDraftAgent.optionalContext).toContain('studentAssignments');
      });
    });

    describe('lessonNotesAgent', () => {
      it('should have correct id', () => {
        expect(lessonNotesAgent.id).toBe('lesson-notes-assistant');
      });

      it('should target admin and teacher', () => {
        expect(lessonNotesAgent.targetUsers).toEqual(['admin', 'teacher']);
      });

      it('should have content UI category', () => {
        expect(lessonNotesAgent.uiConfig.category).toBe('content');
      });

      it('should have lesson-related allowed fields', () => {
        expect(lessonNotesAgent.inputValidation.allowedFields).toContain('lesson_topic');
        expect(lessonNotesAgent.inputValidation.allowedFields).toContain('songs_covered');
      });

      it('should have lower temperature for structured content', () => {
        expect(lessonNotesAgent.temperature).toBeLessThanOrEqual(0.7);
      });

      it('should include studentLessons in optionalContext', () => {
        expect(lessonNotesAgent.optionalContext).toContain('studentLessons');
      });

      it('should have guitar-specific system prompt', () => {
        expect(lessonNotesAgent.systemPrompt).toContain('barre');
        expect(lessonNotesAgent.systemPrompt).toContain('BPM');
        expect(lessonNotesAgent.systemPrompt).toContain('fret');
      });
    });

    describe('assignmentGeneratorAgent', () => {
      it('should have correct id', () => {
        expect(assignmentGeneratorAgent.id).toBe('assignment-generator');
      });

      it('should have educational purpose', () => {
        expect(assignmentGeneratorAgent.purpose).toContain('assignment');
        expect(assignmentGeneratorAgent.purpose).toContain('student');
      });

      it('should have appropriate max tokens for detailed assignments', () => {
        expect(assignmentGeneratorAgent.maxTokens).toBeGreaterThanOrEqual(500);
      });

      it('should include student-scoped context keys', () => {
        expect(assignmentGeneratorAgent.optionalContext).toContain('studentAssignments');
        expect(assignmentGeneratorAgent.optionalContext).toContain('studentRepertoire');
      });

      it('should have practice methodology in system prompt', () => {
        expect(assignmentGeneratorAgent.systemPrompt).toContain('Metronome');
        expect(assignmentGeneratorAgent.systemPrompt).toContain('Chunking');
      });
    });

    describe('progressInsightsAgent', () => {
      it('should have correct id', () => {
        expect(progressInsightsAgent.id).toBe('student-progress-insights');
      });

      it('should have analysis UI category', () => {
        expect(progressInsightsAgent.uiConfig.category).toBe('analysis');
      });

      it('should access student-related tables', () => {
        expect(progressInsightsAgent.dataAccess.tables).toContain('profiles');
        expect(progressInsightsAgent.dataAccess.tables).toContain('lessons');
      });

      it('should have read-only permissions', () => {
        expect(progressInsightsAgent.dataAccess.permissions).toContain('read');
        expect(progressInsightsAgent.dataAccess.permissions).not.toContain('write');
      });

      it('should include student-scoped context keys', () => {
        expect(progressInsightsAgent.optionalContext).toContain('studentLessons');
        expect(progressInsightsAgent.optionalContext).toContain('studentRepertoire');
        expect(progressInsightsAgent.optionalContext).toContain('studentAssignments');
      });

      it('should reference guitar learning trajectory in prompt', () => {
        expect(progressInsightsAgent.systemPrompt).toContain('Barre chord barrier');
        expect(progressInsightsAgent.systemPrompt).toContain('Fingerpicking');
      });
    });

    describe('adminInsightsAgent', () => {
      it('should have correct id', () => {
        expect(adminInsightsAgent.id).toBe('admin-dashboard-insights');
      });

      it('should target only admin users', () => {
        expect(adminInsightsAgent.targetUsers).toEqual(['admin']);
      });

      it('should have lower temperature for analytical output', () => {
        expect(adminInsightsAgent.temperature).toBeLessThanOrEqual(0.6);
      });

      it('should reference music school business intelligence', () => {
        expect(adminInsightsAgent.systemPrompt).toContain('Seasonal');
        expect(adminInsightsAgent.systemPrompt).toContain('Retention');
      });
    });

    describe('songNormalizationAgent', () => {
      it('should have correct id', () => {
        expect(songNormalizationAgent.id).toBe('song-normalization');
      });

      it('should target system users', () => {
        expect(songNormalizationAgent.targetUsers).toContain('system');
      });

      it('should have very low temperature for consistent output', () => {
        expect(songNormalizationAgent.temperature).toBeLessThanOrEqual(0.4);
      });

      it('should have song-related fields', () => {
        expect(songNormalizationAgent.inputValidation.allowedFields).toContain('title');
        expect(songNormalizationAgent.inputValidation.allowedFields).toContain('artist');
      });

      it('should not have analytics enabled', () => {
        expect(songNormalizationAgent.enableAnalytics).toBe(false);
      });
    });

    describe('postLessonSummaryAgent', () => {
      it('should exist and have required properties', () => {
        expect(postLessonSummaryAgent).toBeDefined();
        expect(postLessonSummaryAgent.id).toBeDefined();
        expect(postLessonSummaryAgent.name).toBeDefined();
      });

      it('should include student-scoped context keys', () => {
        expect(postLessonSummaryAgent.optionalContext).toContain('studentLessons');
        expect(postLessonSummaryAgent.optionalContext).toContain('studentRepertoire');
      });

      it('should have assessment terminology in system prompt', () => {
        expect(postLessonSummaryAgent.systemPrompt).toContain('Developing');
        expect(postLessonSummaryAgent.systemPrompt).toContain('Mastered');
      });
    });

    describe('chatAssistantAgent', () => {
      it('should have correct id', () => {
        expect(chatAssistantAgent.id).toBe('chat-assistant');
      });

      it('should target admin and teacher users', () => {
        expect(chatAssistantAgent.targetUsers).toContain('admin');
        expect(chatAssistantAgent.targetUsers).toContain('teacher');
      });

      it('should have assistant UI category', () => {
        expect(chatAssistantAgent.uiConfig.category).toBe('assistant');
      });

      it('should have conversational temperature', () => {
        expect(chatAssistantAgent.temperature).toBe(0.7);
      });

      it('should have reasonable max tokens', () => {
        expect(chatAssistantAgent.maxTokens).toBe(800);
      });

      it('should have guitar pedagogy knowledge in system prompt', () => {
        expect(chatAssistantAgent.systemPrompt).toContain('CAGED');
        expect(chatAssistantAgent.systemPrompt).toContain('Pentatonic');
        expect(chatAssistantAgent.systemPrompt).toContain('pedagogy');
      });

      it('should have chat-related allowed fields', () => {
        expect(chatAssistantAgent.inputValidation.allowedFields).toContain('prompt');
        expect(chatAssistantAgent.inputValidation.allowedFields).toContain('model');
      });
    });

    describe('songNotesAgent', () => {
      it('should have correct id', () => {
        expect(songNotesAgent.id).toBe('song-notes-assistant');
      });

      it('should target admin and teacher', () => {
        expect(songNotesAgent.targetUsers).toEqual(['admin', 'teacher']);
      });

      it('should have content UI category', () => {
        expect(songNotesAgent.uiConfig.category).toBe('content');
      });

      it('should read from the songs table only', () => {
        expect(songNotesAgent.dataAccess.tables).toEqual(['songs']);
        expect(songNotesAgent.dataAccess.permissions).toContain('read');
        expect(songNotesAgent.dataAccess.permissions).not.toContain('write');
      });

      it('should expose song detail fields as allowed input', () => {
        expect(songNotesAgent.inputValidation.allowedFields).toContain('title');
        expect(songNotesAgent.inputValidation.allowedFields).toContain('author');
        expect(songNotesAgent.inputValidation.allowedFields).toContain('chords');
      });

      it('should not fetch DB-backed context (inputs arrive as allowed fields)', () => {
        // Regression guard: title/author/etc. are input fields, NOT context keys.
        // Listing them in requiredContext made prepareContext throw on an unknown
        // context key and broke generation. They must stay out of the context arrays.
        expect(songNotesAgent.requiredContext).toEqual([]);
        expect(songNotesAgent.optionalContext).toEqual([]);
      });

      it('should have guitar-specific system prompt', () => {
        expect(songNotesAgent.systemPrompt).toContain('barre');
        expect(songNotesAgent.systemPrompt).toContain('BPM');
        expect(songNotesAgent.systemPrompt).toContain('fingering');
      });

      it('should have two output sections in the prompt', () => {
        expect(songNotesAgent.systemPrompt).toContain('Teaching Tips');
        expect(songNotesAgent.systemPrompt).toContain('Practice Suggestions');
      });
    });

    describe('songNotesEnhancerAgent', () => {
      it('should have correct id', () => {
        expect(songNotesEnhancerAgent.id).toBe('song-notes-enhancer');
      });

      it('should target admin and teacher', () => {
        expect(songNotesEnhancerAgent.targetUsers).toEqual(['admin', 'teacher']);
      });

      it('should have content UI category', () => {
        expect(songNotesEnhancerAgent.uiConfig.category).toBe('content');
      });

      it('should accept rough notes as a required input field', () => {
        expect(songNotesEnhancerAgent.inputValidation.allowedFields).toContain('roughNotes');
        expect(songNotesEnhancerAgent.inputValidation.allowedFields).toContain('title');
        expect(songNotesEnhancerAgent.inputValidation.allowedFields).toContain('author');
      });

      it('should not fetch DB-backed context (inputs arrive as allowed fields)', () => {
        // roughNotes/title/author are input fields injected into the user message,
        // not context keys — keep them out of the context arrays so prepareContext
        // does not throw on an unknown key.
        expect(songNotesEnhancerAgent.requiredContext).toEqual([]);
        expect(songNotesEnhancerAgent.optionalContext).toEqual([]);
      });

      it('should instruct preserving all of the teacher notes', () => {
        expect(songNotesEnhancerAgent.systemPrompt).toContain('Preserve ALL');
        expect(songNotesEnhancerAgent.systemPrompt).toContain('rough notes');
      });

      it('should have a lower temperature than the from-scratch notes agent', () => {
        // Enhancing should stay faithful to the teacher's input, so it runs cooler.
        expect(songNotesEnhancerAgent.temperature).toBeLessThan(songNotesAgent.temperature);
      });

      it('should allow longer input than the from-scratch notes agent', () => {
        // It must fit the teacher's rough notes plus song metadata.
        expect(songNotesEnhancerAgent.inputValidation.maxLength).toBeGreaterThan(
          songNotesAgent.inputValidation.maxLength
        );
      });
    });
  });

  describe('Agent Categories', () => {
    it('should export communicationAgents', () => {
      expect(communicationAgents).toHaveProperty('emailDraftAgent');
    });

    it('should export contentAgents', () => {
      expect(contentAgents).toHaveProperty('lessonNotesAgent');
      expect(contentAgents).toHaveProperty('assignmentGeneratorAgent');
      expect(contentAgents).toHaveProperty('postLessonSummaryAgent');
    });

    it('should export analyticsAgents', () => {
      expect(analyticsAgents).toHaveProperty('progressInsightsAgent');
      expect(analyticsAgents).toHaveProperty('adminInsightsAgent');
    });

    it('should export systemAgents', () => {
      expect(systemAgents).toHaveProperty('songNormalizationAgent');
    });

    it('should export assistantAgents', () => {
      expect(assistantAgents).toHaveProperty('chatAssistantAgent');
    });

    it('should export songContentAgents', () => {
      expect(songContentAgents).toHaveProperty('songNotesAgent');
      expect(songContentAgents).toHaveProperty('songNotesEnhancerAgent');
    });
  });

  describe('Agent Specification Validation', () => {
    const uiAgents = [
      emailDraftAgent,
      lessonNotesAgent,
      assignmentGeneratorAgent,
      progressInsightsAgent,
      adminInsightsAgent,
      chatAssistantAgent,
      songNotesAgent,
      songNotesEnhancerAgent,
    ];

    const allAgents = [
      emailDraftAgent,
      lessonNotesAgent,
      assignmentGeneratorAgent,
      progressInsightsAgent,
      adminInsightsAgent,
      songNormalizationAgent,
      chatAssistantAgent,
      songNotesAgent,
      songNotesEnhancerAgent,
    ];

    allAgents.forEach((agent) => {
      describe(`${agent.name}`, () => {
        it('should have valid id format', () => {
          expect(agent.id).toMatch(/^[a-z0-9-]+$/);
        });

        it('should have version string', () => {
          expect(agent.version).toMatch(/^\d+\.\d+\.\d+$/);
        });

        it('should have non-empty purpose', () => {
          expect(agent.purpose.length).toBeGreaterThan(20);
        });

        it('should have at least one use case', () => {
          expect(agent.useCases.length).toBeGreaterThan(0);
        });

        it('should have at least one limitation', () => {
          expect(agent.limitations.length).toBeGreaterThan(0);
        });

        it('should have system prompt', () => {
          expect(agent.systemPrompt.length).toBeGreaterThan(50);
        });

        it('should have temperature between 0 and 1', () => {
          expect(agent.temperature).toBeGreaterThanOrEqual(0);
          expect(agent.temperature).toBeLessThanOrEqual(1);
        });

        it('should have valid input validation config', () => {
          expect(agent.inputValidation.maxLength).toBeGreaterThan(0);
          expect(agent.inputValidation.allowedFields.length).toBeGreaterThan(0);
          expect(['block', 'sanitize', 'allow']).toContain(
            agent.inputValidation.sensitiveDataHandling
          );
        });
      });
    });

    // Test UI config separately for agents that have it
    uiAgents.forEach((agent) => {
      describe(`${agent.name} UI Config`, () => {
        it('should have valid UI config', () => {
          expect(['content', 'analysis', 'automation', 'communication', 'assistant']).toContain(
            agent.uiConfig.category
          );
          expect(agent.uiConfig.icon).toBeDefined();
          expect(agent.uiConfig.placement.length).toBeGreaterThan(0);
        });
      });
    });

    describe('songNormalizationAgent (System Agent)', () => {
      it('should not require uiConfig for system agents', () => {
        // System agents may not have uiConfig - this is expected
        expect(songNormalizationAgent.targetUsers).toContain('system');
      });
    });
  });

  describe('registerAllAgents', () => {
    beforeEach(() => {
      // Clear registry before each test
      const agents = getAllAgents();
      agents.forEach((agent) => unregisterAgent(agent.id));
    });

    it('should register all agents without error', () => {
      expect(() => registerAllAgents()).not.toThrow();
    });

    it('should register expected number of agents', () => {
      registerAllAgents();
      const agents = getAllAgents();
      expect(agents.length).toBeGreaterThanOrEqual(7);
    });

    it('should register communication agents', () => {
      registerAllAgents();
      expect(hasAgent('email-draft-generator')).toBe(true);
    });

    it('should register content agents', () => {
      registerAllAgents();
      expect(hasAgent('lesson-notes-assistant')).toBe(true);
      expect(hasAgent('assignment-generator')).toBe(true);
    });

    it('should register analytics agents', () => {
      registerAllAgents();
      expect(hasAgent('student-progress-insights')).toBe(true);
      expect(hasAgent('admin-dashboard-insights')).toBe(true);
    });

    it('should register system agents', () => {
      registerAllAgents();
      expect(hasAgent('song-normalization')).toBe(true);
    });

    it('should register assistant agents', () => {
      registerAllAgents();
      expect(hasAgent('chat-assistant')).toBe(true);
    });

    it('should register song content agents', () => {
      registerAllAgents();
      expect(hasAgent('song-notes-assistant')).toBe(true);
      expect(hasAgent('song-notes-enhancer')).toBe(true);
    });
  });
});

describe('Agent Registry Core', () => {
  beforeEach(() => {
    // Clear registry
    const agents = getAllAgents();
    agents.forEach((agent) => unregisterAgent(agent.id));
  });

  describe('registerAgent', () => {
    it('should register a valid agent', () => {
      registerAgent(emailDraftAgent);
      expect(hasAgent('email-draft-generator')).toBe(true);
    });

    it('should make agent retrievable', () => {
      registerAgent(emailDraftAgent);
      const agent = getAgent('email-draft-generator');
      expect(agent).toBeDefined();
      expect(agent?.name).toBe('Email Draft Generator');
    });
  });

  describe('getAgent', () => {
    it('should return undefined for non-existent agent', () => {
      const agent = getAgent('non-existent-agent');
      expect(agent).toBeUndefined();
    });

    it('should return correct agent', () => {
      registerAgent(lessonNotesAgent);
      const agent = getAgent('lesson-notes-assistant');
      expect(agent?.id).toBe('lesson-notes-assistant');
    });
  });

  describe('getAllAgents', () => {
    it('should return empty array when no agents registered', () => {
      const agents = getAllAgents();
      expect(agents).toEqual([]);
    });

    it('should return all registered agents', () => {
      registerAgent(emailDraftAgent);
      registerAgent(lessonNotesAgent);
      const agents = getAllAgents();
      expect(agents.length).toBe(2);
    });
  });

  describe('getAvailableAgents', () => {
    beforeEach(() => {
      registerAgent(emailDraftAgent);
      registerAgent(adminInsightsAgent);
      registerAgent(lessonNotesAgent);
      registerAgent(chatAssistantAgent);
    });

    it('should filter agents by admin role', () => {
      const agents = getAvailableAgents('admin');
      expect(agents.length).toBe(4);
    });

    it('should filter agents by teacher role', () => {
      const agents = getAvailableAgents('teacher');
      // Admin insights is admin-only
      expect(agents.length).toBe(3);
    });

    it('should return empty for student (no student agents in test set)', () => {
      const agents = getAvailableAgents('student');
      expect(agents.length).toBe(0);
    });
  });

  describe('hasAgent', () => {
    it('should return false for non-existent agent', () => {
      expect(hasAgent('fake-agent')).toBe(false);
    });

    it('should return true for registered agent', () => {
      registerAgent(emailDraftAgent);
      expect(hasAgent('email-draft-generator')).toBe(true);
    });
  });

  describe('unregisterAgent', () => {
    it('should remove registered agent', () => {
      registerAgent(emailDraftAgent);
      expect(hasAgent('email-draft-generator')).toBe(true);

      unregisterAgent('email-draft-generator');
      expect(hasAgent('email-draft-generator')).toBe(false);
    });

    it('should return true when agent was removed', () => {
      registerAgent(emailDraftAgent);
      const result = unregisterAgent('email-draft-generator');
      expect(result).toBe(true);
    });

    it('should return false when agent did not exist', () => {
      const result = unregisterAgent('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('getRegistryStats', () => {
    beforeEach(() => {
      registerAgent(emailDraftAgent);
      registerAgent(lessonNotesAgent);
      registerAgent(adminInsightsAgent);
      registerAgent(chatAssistantAgent);
    });

    it('should return total agent count', () => {
      const stats = getRegistryStats();
      expect(stats.totalAgents).toBe(4);
    });

    it('should categorize agents by UI category', () => {
      const stats = getRegistryStats();
      expect(stats.agentsByCategory.communication).toBe(1);
      expect(stats.agentsByCategory.content).toBe(1);
      expect(stats.agentsByCategory.analysis).toBe(1);
      expect(stats.agentsByCategory.assistant).toBe(1);
    });

    it('should categorize agents by target user', () => {
      const stats = getRegistryStats();
      expect(stats.agentsByTargetUser.admin).toBe(4);
      expect(stats.agentsByTargetUser.teacher).toBe(3);
    });
  });
});

describe('Agent Execution', () => {
  beforeEach(() => {
    // Register agents
    const agents = getAllAgents();
    agents.forEach((agent) => unregisterAgent(agent.id));
    registerAgent(emailDraftAgent);
    registerAgent(lessonNotesAgent);
    registerAgent(chatAssistantAgent);
    registerAgent(songNotesAgent);
    registerAgent(songNotesEnhancerAgent);
  });

  const mockContext: Partial<AgentContext> = {
    userId: 'test-user-123',
    userRole: 'admin',
    sessionId: 'test-session',
  };

  it('should return error for non-existent agent', async () => {
    const result = await executeAgent('non-existent-agent', { message: 'test' }, mockContext);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('AGENT_NOT_FOUND');
  });

  it('should execute registered agent', async () => {
    const result = await executeAgent(
      'email-draft-generator',
      { template_type: 'reminder', student_name: 'Test Student' },
      mockContext
    );

    // Should execute (mocked provider)
    expect(result).toBeDefined();
    expect(result.metadata.agentId).toBe('email-draft-generator');
  });

  it('should execute chat assistant agent', async () => {
    const result = await executeAgent(
      'chat-assistant',
      { prompt: 'What are good beginner guitar songs?' },
      mockContext
    );

    expect(result).toBeDefined();
    expect(result.metadata.agentId).toBe('chat-assistant');
  });

  it('should execute song-notes-assistant without a context-fetch failure', async () => {
    // Regression: title/author were previously in requiredContext, so prepareContext
    // threw "Unknown context key: title" and generation always errored. With the
    // context arrays empty, the agent runs end-to-end against the mocked provider.
    const result = await executeAgent(
      'song-notes-assistant',
      { title: 'Wonderwall', author: 'Oasis', key: 'F#m', chords: 'Em7 G Dsus4 A7sus4' },
      mockContext
    );

    expect(result.success).toBe(true);
    expect(result.metadata.agentId).toBe('song-notes-assistant');
  });

  it('should execute song-notes-enhancer without a context-fetch failure', async () => {
    const result = await executeAgent(
      'song-notes-enhancer',
      {
        roughNotes: 'tricky barre chord, slow strum, watch tempo',
        title: 'Wonderwall',
        author: 'Oasis',
      },
      mockContext
    );

    expect(result.success).toBe(true);
    expect(result.metadata.agentId).toBe('song-notes-enhancer');
  });

  it('should include execution metadata', async () => {
    const result = await executeAgent(
      'email-draft-generator',
      { template_type: 'reminder' },
      mockContext
    );

    expect(result.metadata).toBeDefined();
    expect(result.metadata.executionTime).toBeGreaterThanOrEqual(0);
    expect(result.analytics).toBeDefined();
    expect(result.analytics.requestId).toBeDefined();
  });

  it('should check rate limits', async () => {
    const { checkRateLimit } = require('../rate-limiter');

    await executeAgent('email-draft-generator', { template_type: 'test' }, mockContext);

    expect(checkRateLimit).toHaveBeenCalled();
  });
});
