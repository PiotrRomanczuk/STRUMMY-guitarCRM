import {
  getUIVersionFromCookie,
  setUIVersionCookie,
  COOKIE_NAME,
  DEFAULT_VERSION,
} from '@/lib/ui-version';
import type { UIVersion } from '@/lib/ui-version';

// ──────────────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────────────
describe('ui-version constants', () => {
  it('COOKIE_NAME is strummy-ui-version', () => {
    expect(COOKIE_NAME).toBe('strummy-ui-version');
  });

  it('DEFAULT_VERSION is v2', () => {
    expect(DEFAULT_VERSION).toBe('v2');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// getUIVersionFromCookie
// ──────────────────────────────────────────────────────────────────────────────
describe('getUIVersionFromCookie', () => {
  const originalCookie = Object.getOwnPropertyDescriptor(document, 'cookie');

  afterEach(() => {
    // Restore original cookie descriptor
    if (originalCookie) {
      Object.defineProperty(document, 'cookie', originalCookie);
    } else {
      // Reset cookie to empty
      document.cookie = `${COOKIE_NAME}=;max-age=0`;
    }
  });

  it('returns v2 (default) when no cookie is set', () => {
    // Clear the cookie
    document.cookie = `${COOKIE_NAME}=;max-age=0`;
    const result = getUIVersionFromCookie();
    expect(result).toBe('v2');
  });

  it('returns v2 when cookie is set to v2', () => {
    document.cookie = `${COOKIE_NAME}=v2;path=/`;
    const result = getUIVersionFromCookie();
    expect(result).toBe('v2');
  });

  it('returns v2 when cookie has an invalid value', () => {
    document.cookie = `${COOKIE_NAME}=invalid;path=/`;
    const result = getUIVersionFromCookie();
    expect(result).toBe('v2');
  });

  it('returns v1 when cookie is set to v1 explicitly', () => {
    document.cookie = `${COOKIE_NAME}=v1;path=/`;
    const result = getUIVersionFromCookie();
    expect(result).toBe('v1');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// setUIVersionCookie
// ──────────────────────────────────────────────────────────────────────────────
describe('setUIVersionCookie', () => {
  afterEach(() => {
    document.cookie = `${COOKIE_NAME}=;max-age=0`;
  });

  it('sets cookie to v2 and can be read back', () => {
    setUIVersionCookie('v2');
    const result = getUIVersionFromCookie();
    expect(result).toBe('v2');
  });

  it('sets cookie to v1 and can be read back', () => {
    setUIVersionCookie('v2');
    setUIVersionCookie('v1');
    const result = getUIVersionFromCookie();
    expect(result).toBe('v1');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// useUIVersion hook
// ──────────────────────────────────────────────────────────────────────────────
describe('useUIVersion hook', () => {
  // We test the hook indirectly via its cookie-reading behavior since
  // the hook triggers window.location.reload which is hard to test.
  // The core logic we can verify is the cookie integration.

  beforeEach(() => {
    document.cookie = `${COOKIE_NAME}=;max-age=0`;
  });

  it('reads v2 by default from cookie', () => {
    const version = getUIVersionFromCookie();
    expect(version).toBe('v2');
  });

  it('reads v2 after cookie is set', () => {
    setUIVersionCookie('v2');
    const version = getUIVersionFromCookie();
    expect(version).toBe('v2');
  });

  it('toggle logic: v2 -> v1', () => {
    setUIVersionCookie('v2');
    const current = getUIVersionFromCookie();
    const toggled: UIVersion = current === 'v1' ? 'v2' : 'v1';
    expect(toggled).toBe('v1');
  });

  it('toggle logic: v1 -> v2', () => {
    setUIVersionCookie('v1');
    const current = getUIVersionFromCookie();
    const toggled: UIVersion = current === 'v1' ? 'v2' : 'v1';
    expect(toggled).toBe('v2');
  });
});
