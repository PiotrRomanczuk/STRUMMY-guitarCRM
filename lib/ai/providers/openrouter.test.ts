/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * OpenRouter Provider Tests
 *
 * Tests for the OpenRouter AI provider implementation.
 */

import { createOpenRouterProvider, OpenRouterProvider } from './openrouter';
import type { AICompletionRequest } from '../types';

// Mock the retry module
jest.mock('../retry', () => ({
  withRetry: jest.fn((fn) => fn()),
  AI_PROVIDER_RETRY_CONFIG: {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    retryableErrors: ['rate limit', '429', '500', '502', '503', '504'],
  },
}));

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('OpenRouter Provider', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      OPENROUTER_API_KEY: 'test-api-key',
      NEXT_PUBLIC_API_BASE_URL: 'https://strummy.test',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('createOpenRouterProvider', () => {
    it('should create a provider with correct name', () => {
      const provider = createOpenRouterProvider();

      expect(provider.name).toBe('OpenRouter');
    });

    it('should create a provider with all required methods', () => {
      const provider = createOpenRouterProvider();

      expect(typeof provider.listModels).toBe('function');
      expect(typeof provider.complete).toBe('function');
      expect(typeof provider.isAvailable).toBe('function');
      expect(typeof provider.getConfig).toBe('function');
    });

    it('should use default configuration', () => {
      const provider = createOpenRouterProvider();
      const config = provider.getConfig();

      expect(config.baseUrl).toBe('https://openrouter.ai/api/v1');
      expect(config.apiKey).toBe('test-api-key');
      expect(config.timeout).toBe(60000);
      expect(config.maxRetries).toBe(3);
    });

    it('should merge custom configuration', () => {
      const provider = createOpenRouterProvider({
        timeout: 60000,
        maxRetries: 5,
      });
      const config = provider.getConfig();

      expect(config.timeout).toBe(60000);
      expect(config.maxRetries).toBe(5);
      expect(config.baseUrl).toBe('https://openrouter.ai/api/v1');
    });

    it('should include HTTP-Referer header from environment', () => {
      const provider = createOpenRouterProvider();
      const config = provider.getConfig();

      expect(config.headers).toBeDefined();
      expect(config.headers?.['HTTP-Referer']).toBe('https://strummy.test');
      expect(config.headers?.['X-Title']).toBe('Guitar CRM');
    });

    it('should use default referer when env not set', () => {
      delete process.env.NEXT_PUBLIC_API_BASE_URL;
      const provider = createOpenRouterProvider();
      const config = provider.getConfig();

      expect(config.headers?.['HTTP-Referer']).toBe('http://localhost:3000');
    });
  });

  describe('listModels', () => {
    it('should return list of free models', async () => {
      const provider = createOpenRouterProvider();
      const models = await provider.listModels();

      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
    });

    it('should return models with correct structure', async () => {
      const provider = createOpenRouterProvider();
      const models = await provider.listModels();

      const firstModel = models[0];
      expect(firstModel).toHaveProperty('id');
      expect(firstModel).toHaveProperty('name');
      expect(firstModel).toHaveProperty('provider');
      expect(firstModel).toHaveProperty('description');
      expect(firstModel).toHaveProperty('bestFor');
      expect(firstModel).toHaveProperty('contextWindow');
      expect(firstModel).toHaveProperty('isFree');
    });

    it('should include popular models', async () => {
      const provider = createOpenRouterProvider();
      const models = await provider.listModels();
      const modelIds = models.map((m) => m.id);

      expect(modelIds).toContain('meta-llama/llama-3.3-70b-instruct:free');
      expect(modelIds).toContain('mistralai/mistral-7b-instruct:free');
    });

    it('should mark all models as free', async () => {
      const provider = createOpenRouterProvider();
      const models = await provider.listModels();

      expect(models.every((m) => m.isFree === true)).toBe(true);
    });
  });

  describe('isAvailable', () => {
    it('should return true when API key is configured', async () => {
      const provider = createOpenRouterProvider();
      const available = await provider.isAvailable();

      expect(available).toBe(true);
    });

    it('should return false when API key is not configured', async () => {
      delete process.env.OPENROUTER_API_KEY;
      const provider = createOpenRouterProvider({ apiKey: undefined });
      const available = await provider.isAvailable();

      expect(available).toBe(false);
    });

    it('should return true when API key is passed in config', async () => {
      delete process.env.OPENROUTER_API_KEY;
      const provider = createOpenRouterProvider({ apiKey: 'custom-key' });
      const available = await provider.isAvailable();

      expect(available).toBe(true);
    });
  });

  describe('complete', () => {
    const mockRequest: AICompletionRequest = {
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello!' },
      ],
      temperature: 0.7,
      maxTokens: 500,
    };

    it('should return error when API key is not configured', async () => {
      delete process.env.OPENROUTER_API_KEY;
      const provider = createOpenRouterProvider({ apiKey: undefined });

      const result = await provider.complete(mockRequest);

      expect('error' in result).toBe(true);
      expect((result as any).error).toContain('API key is not configured');
    });

    it('should make correct API request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'Hello there!' }, finish_reason: 'stop' }],
            usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
          }),
      });

      const provider = createOpenRouterProvider();
      await provider.complete(mockRequest);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-api-key',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should send correct request body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'Response' }, finish_reason: 'stop' }],
          }),
      });

      const provider = createOpenRouterProvider();
      await provider.complete(mockRequest);

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.model).toBe('meta-llama/llama-3.3-70b-instruct:free');
      expect(body.messages).toEqual(mockRequest.messages);
      expect(body.temperature).toBe(0.7);
      expect(body.max_tokens).toBe(500);
      expect(body.stream).toBe(false);
    });

    it('should return successful completion response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'Hello! How can I help you?' }, finish_reason: 'stop' }],
            usage: { prompt_tokens: 10, completion_tokens: 8, total_tokens: 18 },
          }),
      });

      const provider = createOpenRouterProvider();
      const result = await provider.complete(mockRequest);

      expect('content' in result).toBe(true);
      expect((result as any).content).toBe('Hello! How can I help you?');
      expect((result as any).finishReason).toBe('stop');
      expect((result as any).usage).toEqual({
        promptTokens: 10,
        completionTokens: 8,
        totalTokens: 18,
      });
    });

    it('should handle response without usage data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'Response without usage' } }],
          }),
      });

      const provider = createOpenRouterProvider();
      const result = await provider.complete(mockRequest);

      expect('content' in result).toBe(true);
      expect((result as any).content).toBe('Response without usage');
      expect((result as any).usage).toBeUndefined();
    });

    it('should handle empty choices', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [],
          }),
      });

      const provider = createOpenRouterProvider();
      const result = await provider.complete(mockRequest);

      expect('content' in result).toBe(true);
      expect((result as any).content).toBe('');
    });

    it('should handle API error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ error: 'Invalid API key' }),
      });

      const provider = createOpenRouterProvider();
      const result = await provider.complete(mockRequest);

      expect('error' in result).toBe(true);
      expect((result as any).error).toContain('Failed to connect to OpenRouter');
    });

    it('should handle rate limit error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: () => Promise.resolve({ error: 'Rate limit exceeded' }),
      });

      const provider = createOpenRouterProvider();
      const result = await provider.complete(mockRequest);

      expect('error' in result).toBe(true);
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const provider = createOpenRouterProvider();
      const result = await provider.complete(mockRequest);

      expect('error' in result).toBe(true);
      expect((result as any).error).toContain('Failed to connect to OpenRouter');
    });

    it('should handle timeout error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('timeout'));

      const provider = createOpenRouterProvider();
      const result = await provider.complete(mockRequest);

      expect('error' in result).toBe(true);
      expect((result as any).error).toContain('Failed to connect to OpenRouter');
    });

    it('should handle JSON parse error in error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      const provider = createOpenRouterProvider();
      const result = await provider.complete(mockRequest);

      expect('error' in result).toBe(true);
    });

    it('should use stream: false by default', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'Response' } }],
          }),
      });

      const provider = createOpenRouterProvider();
      await provider.complete({
        model: 'test-model',
        messages: [{ role: 'user', content: 'Hello' }],
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.stream).toBe(false);
    });

    it('should handle explicit stream: true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'Response' } }],
          }),
      });

      const provider = createOpenRouterProvider();
      await provider.complete({
        ...mockRequest,
        stream: true,
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.stream).toBe(true);
    });
  });

  describe('getConfig', () => {
    it('should return a copy of the config', () => {
      const provider = createOpenRouterProvider();
      const config1 = provider.getConfig();
      const config2 = provider.getConfig();

      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });

    it('should not expose mutable internal state', () => {
      const provider = createOpenRouterProvider();
      const config = provider.getConfig();

      // Mutating the returned config
      config.apiKey = 'mutated-key';

      // Should not affect internal state
      const freshConfig = provider.getConfig();
      expect(freshConfig.apiKey).toBe('test-api-key');
    });
  });
});

describe('OpenRouterProvider Class', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      OPENROUTER_API_KEY: 'test-api-key',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should have correct name property', () => {
    const provider = new OpenRouterProvider();
    expect(provider.name).toBe('OpenRouter');
  });

  it('should implement AIProvider interface', () => {
    const provider = new OpenRouterProvider();

    expect(typeof provider.listModels).toBe('function');
    expect(typeof provider.complete).toBe('function');
    expect(typeof provider.isAvailable).toBe('function');
    expect(typeof provider.getConfig).toBe('function');
  });

  it('should accept custom configuration', () => {
    const provider = new OpenRouterProvider({
      timeout: 60000,
      apiKey: 'custom-key',
    });
    const config = provider.getConfig();

    expect(config.timeout).toBe(60000);
    expect(config.apiKey).toBe('custom-key');
  });

  it('should list models', async () => {
    const provider = new OpenRouterProvider();
    const models = await provider.listModels();

    expect(Array.isArray(models)).toBe(true);
    expect(models.length).toBeGreaterThan(0);
  });

  it('should check availability', async () => {
    const provider = new OpenRouterProvider();
    const available = await provider.isAvailable();

    expect(available).toBe(true);
  });

  it('should complete requests', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [{ message: { content: 'Class response' }, finish_reason: 'stop' }],
        }),
    });

    const provider = new OpenRouterProvider();
    const result = await provider.complete({
      model: 'test-model',
      messages: [{ role: 'user', content: 'Hello' }],
    });

    expect('content' in result).toBe(true);
    expect((result as any).content).toBe('Class response');
  });
});

describe('Model Information', () => {
  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = 'test-key';
  });

  it('should include Llama model with correct info', async () => {
    const provider = createOpenRouterProvider();
    const models = await provider.listModels();
    const llamaModel = models.find((m) => m.id.includes('llama-3.3-70b'));

    expect(llamaModel).toBeDefined();
    expect(llamaModel?.provider).toBe('Meta');
    expect(llamaModel?.contextWindow).toBe(128000);
    expect(llamaModel?.isFree).toBe(true);
  });

  it('should include Mistral model with correct info', async () => {
    const provider = createOpenRouterProvider();
    const models = await provider.listModels();
    const mistralModel = models.find((m) => m.id.includes('mistral-7b'));

    expect(mistralModel).toBeDefined();
    expect(mistralModel?.provider).toBe('Mistral AI');
    expect(mistralModel?.isFree).toBe(true);
  });

  it('should include DeepSeek model with correct info', async () => {
    const provider = createOpenRouterProvider();
    const models = await provider.listModels();
    const deepseekModel = models.find((m) => m.id.includes('deepseek'));

    expect(deepseekModel).toBeDefined();
    expect(deepseekModel?.provider).toBe('DeepSeek');
    expect(deepseekModel?.bestFor).toContain('Coding');
  });

  it('should include Gemini model with correct info', async () => {
    const provider = createOpenRouterProvider();
    const models = await provider.listModels();
    const geminiModel = models.find((m) => m.id.includes('gemini-2.0'));

    expect(geminiModel).toBeDefined();
    expect(geminiModel?.provider).toBe('Google');
    expect(geminiModel?.contextWindow).toBe(1048576);
  });
});
