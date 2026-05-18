import { isBrowserRuntime, isEdgeRuntime } from '../logger/shared';

describe('runtime detection', () => {
  const originalWindow = (globalThis as { window?: unknown }).window;

  afterEach(() => {
    if (originalWindow === undefined) {
      delete (globalThis as { window?: unknown }).window;
    } else {
      (globalThis as { window?: unknown }).window = originalWindow;
    }
    delete (globalThis as { EdgeRuntime?: string }).EdgeRuntime;
  });

  describe('isBrowserRuntime', () => {
    // The Jest test env is jsdom which always provides a `window` global.
    // We can't simulate a no-window context from inside jsdom, so we only
    // verify the positive case — the absence path runs in real Node code.
    it('returns true when window is defined (jsdom default)', () => {
      (globalThis as { window?: unknown }).window = {};
      expect(isBrowserRuntime()).toBe(true);
    });
  });

  describe('isEdgeRuntime', () => {
    it('returns false when EdgeRuntime global is absent', () => {
      delete (globalThis as { EdgeRuntime?: string }).EdgeRuntime;
      expect(isEdgeRuntime()).toBe(false);
    });

    it('returns true when EdgeRuntime global is set (Vercel Edge convention)', () => {
      (globalThis as { EdgeRuntime?: string }).EdgeRuntime = 'edge-runtime';
      expect(isEdgeRuntime()).toBe(true);
    });
  });
});
