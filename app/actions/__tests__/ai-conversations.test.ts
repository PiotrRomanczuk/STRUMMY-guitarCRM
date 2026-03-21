/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * AI Conversation Server Actions Tests
 *
 * Tests CRUD operations for ai_conversations and ai_messages tables.
 * @see app/actions/ai-conversations.ts
 */

import {
  createConversation,
  listConversations,
  getConversation,
  updateConversationTitle,
  archiveConversation,
  deleteConversation,
  saveConversationMessages,
  trackAIUsage,
} from '../ai-conversations';

// Mock getUserWithRolesSSR
jest.mock('@/lib/getUserWithRolesSSR', () => ({
  getUserWithRolesSSR: jest.fn(() => Promise.resolve({ isDevelopment: false })),
}));

// ── Supabase mock helpers ────────────────────────────────────────

const mockGetUser = jest.fn();
let mockChain: Record<string, jest.Mock> = {};

function resetChain(resolveValue: any = { data: null, error: null }) {
  const self: any = {};
  const methods = ['from', 'select', 'insert', 'update', 'delete', 'eq', 'order', 'range', 'single'];
  for (const m of methods) {
    self[m] = jest.fn().mockReturnValue(self);
  }
  // Terminal calls resolve with value
  self.single.mockResolvedValue(resolveValue);
  self.select.mockReturnValue(self);
  self.then = (resolve: any) => resolve(resolveValue);
  // Make it thenable for await
  Object.defineProperty(self, 'then', {
    value: (resolve: any) => Promise.resolve(resolveValue).then(resolve),
    writable: true,
  });
  mockChain = self;
  return self;
}

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: { getUser: () => mockGetUser() },
      from: (...args: any[]) => mockChain.from(...args),
    })
  ),
}));

// ── Test constants ───────────────────────────────────────────────

const MOCK_USER_ID = 'user-111';
const MOCK_CONV_ID = 'conv-222';

function authAsUser() {
  mockGetUser.mockResolvedValue({ data: { user: { id: MOCK_USER_ID } } });
}

function authAsNone() {
  mockGetUser.mockResolvedValue({ data: { user: null } });
}

// ── Tests ────────────────────────────────────────────────────────

describe('ai-conversations actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── createConversation ─────────────────────────────────────────

  describe('createConversation', () => {
    it('returns created conversation on success', async () => {
      authAsUser();
      const mockConv = { id: MOCK_CONV_ID, model_id: 'gpt-4', title: null };
      resetChain({ data: mockConv, error: null });

      const result = await createConversation({ modelId: 'gpt-4' });

      expect(result.data).toEqual(mockConv);
      expect(result.error).toBeUndefined();
    });

    it('returns error when not authenticated', async () => {
      authAsNone();
      resetChain();

      const result = await createConversation({ modelId: 'gpt-4' });

      expect(result.error).toBe('Unauthorized');
      expect(result.data).toBeUndefined();
    });

    it('returns error on Supabase failure', async () => {
      authAsUser();
      resetChain({ data: null, error: { message: 'DB error' } });

      const result = await createConversation({ modelId: 'gpt-4' });

      expect(result.error).toBe('DB error');
    });
  });

  // ── listConversations ──────────────────────────────────────────

  describe('listConversations', () => {
    it('returns paginated list', async () => {
      authAsUser();
      const items = [{ id: 'c1', title: 'Test', context_type: 'general' }];
      resetChain({ data: items, count: 1, error: null });

      const result = await listConversations({ page: 0, pageSize: 10 });

      expect(result.data).toEqual(items);
      expect(result.total).toBe(1);
    });

    it('returns empty list on error', async () => {
      authAsUser();
      resetChain({ data: null, count: 0, error: { message: 'fail' } });

      const result = await listConversations();

      expect(result.data).toEqual([]);
      expect(result.error).toBe('fail');
    });

    it('returns error when not authenticated', async () => {
      authAsNone();
      resetChain();

      const result = await listConversations();

      expect(result.error).toBe('Unauthorized');
    });
  });

  // ── getConversation ────────────────────────────────────────────

  describe('getConversation', () => {
    it('returns conversation with messages', async () => {
      authAsUser();
      const conv = { id: MOCK_CONV_ID, title: 'Chat' };
      const msgs = [{ id: 'm1', role: 'user', content: 'hello' }];

      // First call (conversation), second call (messages)
      let callIndex = 0;
      const chain = resetChain();
      chain.from.mockImplementation(() => {
        callIndex++;
        if (callIndex === 1) {
          // conversation query
          const inner: any = {};
          const fns = ['select', 'eq', 'single'];
          for (const f of fns) inner[f] = jest.fn().mockReturnValue(inner);
          inner.single.mockResolvedValue({ data: conv, error: null });
          return inner;
        }
        // messages query
        const inner: any = {};
        const fns2 = ['select', 'eq', 'order'];
        for (const f of fns2) inner[f] = jest.fn().mockReturnValue(inner);
        Object.defineProperty(inner, 'then', {
          value: (r: any) => Promise.resolve({ data: msgs, error: null }).then(r),
          writable: true,
        });
        return inner;
      });

      const result = await getConversation(MOCK_CONV_ID);

      expect(result.data?.id).toBe(MOCK_CONV_ID);
      expect(result.data?.messages).toEqual(msgs);
    });

    it('returns error when conversation not found', async () => {
      authAsUser();
      const chain = resetChain();
      chain.from.mockImplementation(() => {
        const inner: any = {};
        const fns = ['select', 'eq', 'single'];
        for (const f of fns) inner[f] = jest.fn().mockReturnValue(inner);
        inner.single.mockResolvedValue({ data: null, error: { message: 'Not found' } });
        return inner;
      });

      const result = await getConversation('nonexistent');

      expect(result.error).toBe('Not found');
    });
  });

  // ── updateConversationTitle ────────────────────────────────────

  describe('updateConversationTitle', () => {
    it('updates title successfully', async () => {
      authAsUser();
      resetChain({ data: null, error: null });

      const result = await updateConversationTitle(MOCK_CONV_ID, 'New Title');

      expect(result.error).toBeUndefined();
    });

    it('returns error on failure', async () => {
      authAsUser();
      resetChain({ data: null, error: { message: 'Update failed' } });

      const result = await updateConversationTitle(MOCK_CONV_ID, 'New Title');

      expect(result.error).toBe('Update failed');
    });
  });

  // ── archiveConversation ────────────────────────────────────────

  describe('archiveConversation', () => {
    it('archives successfully', async () => {
      authAsUser();
      resetChain({ data: null, error: null });

      const result = await archiveConversation(MOCK_CONV_ID, true);

      expect(result.error).toBeUndefined();
    });

    it('returns error when not authenticated', async () => {
      authAsNone();
      resetChain();

      const result = await archiveConversation(MOCK_CONV_ID, true);

      expect(result.error).toBe('Unauthorized');
    });
  });

  // ── deleteConversation ─────────────────────────────────────────

  describe('deleteConversation', () => {
    it('deletes successfully', async () => {
      authAsUser();
      resetChain({ data: null, error: null });

      const result = await deleteConversation(MOCK_CONV_ID);

      expect(result.error).toBeUndefined();
    });

    it('returns error on Supabase failure', async () => {
      authAsUser();
      resetChain({ data: null, error: { message: 'Delete failed' } });

      const result = await deleteConversation(MOCK_CONV_ID);

      expect(result.error).toBe('Delete failed');
    });
  });

  // ── saveConversationMessages ───────────────────────────────────

  describe('saveConversationMessages', () => {
    it('inserts messages and auto-titles', async () => {
      authAsUser();
      let callIndex = 0;
      const chain = resetChain();
      chain.from.mockImplementation(() => {
        callIndex++;
        const inner: any = {};
        const fns = ['select', 'insert', 'eq', 'update', 'single'];
        for (const f of fns) inner[f] = jest.fn().mockReturnValue(inner);

        if (callIndex === 1) {
          // insert messages
          Object.defineProperty(inner, 'then', {
            value: (r: any) => Promise.resolve({ error: null }).then(r),
            writable: true,
          });
        } else if (callIndex === 2) {
          // count query
          Object.defineProperty(inner, 'then', {
            value: (r: any) => Promise.resolve({ count: 2, error: null }).then(r),
            writable: true,
          });
        } else {
          // update title
          Object.defineProperty(inner, 'then', {
            value: (r: any) => Promise.resolve({ error: null }).then(r),
            writable: true,
          });
        }
        return inner;
      });

      const result = await saveConversationMessages({
        conversationId: MOCK_CONV_ID,
        userMessage: 'Hello',
        assistantMessage: 'Hi there!',
        modelId: 'gpt-4',
      });

      expect(result.error).toBeUndefined();
    });

    it('returns error on insert failure', async () => {
      authAsUser();
      const chain = resetChain();
      chain.from.mockImplementation(() => {
        const inner: any = {};
        const fns = ['select', 'insert', 'eq'];
        for (const f of fns) inner[f] = jest.fn().mockReturnValue(inner);
        Object.defineProperty(inner, 'then', {
          value: (r: any) => Promise.resolve({ error: { message: 'Insert failed' } }).then(r),
          writable: true,
        });
        return inner;
      });

      const result = await saveConversationMessages({
        conversationId: MOCK_CONV_ID,
        userMessage: 'Hello',
        assistantMessage: 'Hi',
        modelId: 'gpt-4',
      });

      expect(result.error).toBe('Insert failed');
    });
  });

  // ── trackAIUsage ───────────────────────────────────────────────

  describe('trackAIUsage', () => {
    it('inserts new usage row when none exists', async () => {
      authAsUser();
      let callIndex = 0;
      const chain = resetChain();
      chain.from.mockImplementation(() => {
        callIndex++;
        const inner: any = {};
        const fns = ['select', 'insert', 'eq', 'single'];
        for (const f of fns) inner[f] = jest.fn().mockReturnValue(inner);

        if (callIndex === 1) {
          // select existing: not found
          inner.single.mockResolvedValue({ data: null, error: null });
        } else {
          // insert new row
          Object.defineProperty(inner, 'then', {
            value: (r: any) => Promise.resolve({ error: null }).then(r),
            writable: true,
          });
        }
        return inner;
      });

      await expect(trackAIUsage({ modelId: 'gpt-4', tokensUsed: 100 })).resolves.not.toThrow();
    });

    it('updates existing usage row', async () => {
      authAsUser();
      let callIndex = 0;
      const chain = resetChain();
      chain.from.mockImplementation(() => {
        callIndex++;
        const inner: any = {};
        const fns = ['select', 'insert', 'update', 'eq', 'single'];
        for (const f of fns) inner[f] = jest.fn().mockReturnValue(inner);

        if (callIndex === 1) {
          // select existing: found
          inner.single.mockResolvedValue({
            data: {
              id: 'usage-1',
              request_count: 5,
              total_tokens: 500,
              total_latency_ms: 1000,
              error_count: 0,
            },
            error: null,
          });
        } else {
          // update row
          Object.defineProperty(inner, 'then', {
            value: (r: any) => Promise.resolve({ error: null }).then(r),
            writable: true,
          });
        }
        return inner;
      });

      await expect(trackAIUsage({ modelId: 'gpt-4', tokensUsed: 50 })).resolves.not.toThrow();
    });

    it('does not throw when not authenticated', async () => {
      authAsNone();
      resetChain();

      // trackAIUsage catches errors silently
      await expect(trackAIUsage({ modelId: 'gpt-4' })).resolves.not.toThrow();
    });
  });
});
