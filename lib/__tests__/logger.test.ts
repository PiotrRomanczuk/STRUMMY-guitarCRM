jest.mock('@sentry/nextjs', () => ({
  addBreadcrumb: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}));

import * as Sentry from '@sentry/nextjs';
import { REDACT_KEYS, createLogger, logger, redactObject } from '../logger';

describe('redactObject', () => {
  it('masks top-level sensitive keys', () => {
    const out = redactObject({
      token: 'abc123',
      access_token: 'xyz',
      refresh_token: 'r1',
      password: 'p',
      api_key: 'k',
      apiKey: 'k2',
      authorization: 'Bearer x',
      cookie: 'session=foo',
      benign: 'visible',
    });

    expect(out.token).toBe('<redacted>');
    expect(out.access_token).toBe('<redacted>');
    expect(out.refresh_token).toBe('<redacted>');
    expect(out.password).toBe('<redacted>');
    expect(out.api_key).toBe('<redacted>');
    expect(out.apiKey).toBe('<redacted>');
    expect(out.authorization).toBe('<redacted>');
    expect(out.cookie).toBe('<redacted>');
    expect(out.benign).toBe('visible');
  });

  it('case-insensitive match', () => {
    const out = redactObject({ Authorization: 'Bearer x', TOKEN: 't' });
    expect(out.Authorization).toBe('<redacted>');
    expect(out.TOKEN).toBe('<redacted>');
  });

  it('recurses into nested objects (e.g. { headers: { authorization } })', () => {
    const out = redactObject({
      headers: { authorization: 'Bearer x', accept: 'application/json' },
      user: { id: '1', password: 'secret' },
    });
    expect((out.headers as Record<string, unknown>).authorization).toBe('<redacted>');
    expect((out.headers as Record<string, unknown>).accept).toBe('application/json');
    expect((out.user as Record<string, unknown>).id).toBe('1');
    expect((out.user as Record<string, unknown>).password).toBe('<redacted>');
  });

  it('walks arrays', () => {
    const out = redactObject({ items: [{ token: 'a' }, { token: 'b' }] });
    expect(out.items).toEqual([{ token: '<redacted>' }, { token: '<redacted>' }]);
  });

  it('preserves null, undefined, and falsy primitives', () => {
    const out = redactObject({ a: null, b: undefined, c: 0, d: false });
    expect(out.a).toBeNull();
    expect(out.b).toBeUndefined();
    expect(out.c).toBe(0);
    expect(out.d).toBe(false);
  });
});

describe('REDACT_KEYS', () => {
  it('covers the conventional secret surface', () => {
    for (const key of [
      'token',
      'access_token',
      'refresh_token',
      'password',
      'api_key',
      'secret',
      'authorization',
      'cookie',
    ]) {
      expect(REDACT_KEYS.has(key)).toBe(true);
    }
  });
});

describe('logger Sentry contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('logger.error with a real Error calls captureException with redacted extras', () => {
    const err = new Error('boom');
    logger.error('something failed', err, { token: 'abc', userId: 'u1' });

    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    const arg = (Sentry.captureException as jest.Mock).mock.calls[0][1];
    expect(arg.extra.token).toBe('<redacted>');
    expect(arg.extra.userId).toBe('u1');
    expect(arg.extra.message).toBe('something failed');
  });

  it('logger.error with a non-Error falls back to captureMessage', () => {
    logger.error('plain string error', 'string-error', { password: 's' });
    expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);
    const arg = (Sentry.captureMessage as jest.Mock).mock.calls[0][1];
    expect(arg.extra.password).toBe('<redacted>');
  });

  it('logger.info adds a Sentry breadcrumb with redacted data', () => {
    logger.info('event', { access_token: 'a', userId: 'u' });
    expect(Sentry.addBreadcrumb).toHaveBeenCalledTimes(1);
    const arg = (Sentry.addBreadcrumb as jest.Mock).mock.calls[0][0];
    expect(arg.data.access_token).toBe('<redacted>');
    expect(arg.data.userId).toBe('u');
    expect(arg.level).toBe('info');
  });

  it('logger.warn adds a Sentry breadcrumb with warning level', () => {
    logger.warn('about to fail', { reason: 'timeout' });
    expect(Sentry.addBreadcrumb).toHaveBeenCalledTimes(1);
    const arg = (Sentry.addBreadcrumb as jest.Mock).mock.calls[0][0];
    expect(arg.level).toBe('warning');
  });
});

describe('createLogger', () => {
  it('returns the BoundLogger shape', () => {
    const l = createLogger('test');
    expect(typeof l.debug).toBe('function');
    expect(typeof l.info).toBe('function');
    expect(typeof l.warn).toBe('function');
    expect(typeof l.error).toBe('function');
  });

  it('namespaces the prefix in the Sentry breadcrumb message', () => {
    jest.clearAllMocks();
    createLogger('my-mod').info('hi');
    const arg = (Sentry.addBreadcrumb as jest.Mock).mock.calls[0][0];
    expect(arg.message).toContain('[my-mod]');
  });
});
