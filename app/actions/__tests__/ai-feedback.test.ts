/* eslint-disable @typescript-eslint/no-explicit-any */
import { getLatestAssistantMessageId, submitAIFeedback } from '../ai-feedback';

const mockGetUser = jest.fn();
let mockChain: Record<string, jest.Mock> = {};

function resetChain(resolveValue: any = { data: null, error: null }) {
  const self: any = {};
  const methods = ['from', 'select', 'update', 'eq', 'order', 'limit', 'maybeSingle'];
  for (const m of methods) self[m] = jest.fn().mockReturnValue(self);
  self.maybeSingle.mockResolvedValue(resolveValue);
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

const MOCK_USER_ID = 'user-111';

function authAsUser() {
  mockGetUser.mockResolvedValue({ data: { user: { id: MOCK_USER_ID } } });
}

function authAsNone() {
  mockGetUser.mockResolvedValue({ data: { user: null } });
}

describe('getLatestAssistantMessageId (AIA-2)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the message id when found', async () => {
    authAsUser();
    resetChain({ data: { id: 'msg-1' }, error: null });

    const result = await getLatestAssistantMessageId('conv-1');
    expect(result).toBe('msg-1');
    expect(mockChain.from).toHaveBeenCalledWith('ai_messages');
    expect(mockChain.eq).toHaveBeenCalledWith('conversation_id', 'conv-1');
    expect(mockChain.eq).toHaveBeenCalledWith('role', 'assistant');
  });

  it('returns null when unauthenticated', async () => {
    authAsNone();
    resetChain();
    expect(await getLatestAssistantMessageId('conv-1')).toBeNull();
  });

  it('returns null on a query error instead of throwing', async () => {
    authAsUser();
    resetChain({ data: null, error: { message: 'boom' } });
    expect(await getLatestAssistantMessageId('conv-1')).toBeNull();
  });
});

describe('submitAIFeedback (AIA-2)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('writes is_helpful for the given message', async () => {
    authAsUser();
    resetChain({ data: null, error: null });

    const result = await submitAIFeedback('msg-1', true);

    expect(result).toEqual({ success: true });
    expect(mockChain.from).toHaveBeenCalledWith('ai_messages');
    expect(mockChain.update).toHaveBeenCalledWith({ is_helpful: true });
    expect(mockChain.eq).toHaveBeenCalledWith('id', 'msg-1');
  });

  it('rejects when unauthenticated', async () => {
    authAsNone();
    resetChain();
    const result = await submitAIFeedback('msg-1', true);
    expect(result).toEqual({ success: false, error: 'Unauthorized' });
  });

  it('surfaces a failure without throwing', async () => {
    authAsUser();
    resetChain({ data: null, error: { message: 'permission denied' } });
    const result = await submitAIFeedback('msg-1', false);
    expect(result).toEqual({ success: false, error: 'Failed to save feedback' });
  });
});
