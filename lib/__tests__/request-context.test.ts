import {
  generateRequestId,
  getRequestContext,
  runWithRequestContext,
} from '../logger/request-context';

describe('request-context', () => {
  describe('runWithRequestContext + getRequestContext', () => {
    it('returns undefined outside any scope', () => {
      expect(getRequestContext()).toBeUndefined();
    });

    it('returns the active context inside a scope', () => {
      const result = runWithRequestContext({ requestId: 'r1', userId: 'u1' }, () => {
        return getRequestContext();
      });
      expect(result).toEqual({ requestId: 'r1', userId: 'u1' });
    });

    it('isolates contexts between concurrent scopes', async () => {
      const a = runWithRequestContext({ requestId: 'A' }, async () => {
        await new Promise((r) => setTimeout(r, 5));
        return getRequestContext()?.requestId;
      });
      const b = runWithRequestContext({ requestId: 'B' }, async () => {
        await new Promise((r) => setTimeout(r, 5));
        return getRequestContext()?.requestId;
      });
      const [resA, resB] = await Promise.all([a, b]);
      expect(resA).toBe('A');
      expect(resB).toBe('B');
    });

    it('does not leak the context after the scope ends', () => {
      runWithRequestContext({ requestId: 'r1' }, () => {
        expect(getRequestContext()).toBeDefined();
      });
      expect(getRequestContext()).toBeUndefined();
    });

    it('propagates context through async work inside the scope', async () => {
      const captured = await runWithRequestContext({ requestId: 'async-1' }, async () => {
        await new Promise((r) => setTimeout(r, 1));
        return getRequestContext();
      });
      expect(captured?.requestId).toBe('async-1');
    });
  });

  describe('generateRequestId', () => {
    it('returns a 12-char base36 string', () => {
      const id = generateRequestId();
      expect(id).toMatch(/^[a-z0-9]{12}$/);
    });

    it('returns different values on successive calls', () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateRequestId()));
      expect(ids.size).toBeGreaterThan(95);
    });
  });
});
