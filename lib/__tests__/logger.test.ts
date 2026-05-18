jest.mock('@sentry/nextjs', () => ({
  addBreadcrumb: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}));

import * as Sentry from '@sentry/nextjs';
import { __internal, createLogger, logger } from '../logger';

const { redactObject, REDACT_KEYS } = __internal;

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

  it('preserves null and undefined', () => {
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

describe('logger.error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('calls Sentry.captureException with a real Error and redacted extras', () => {
    const err = new Error('boom');
    logger.error('something failed', err, { token: 'abc', userId: 'u1' });

    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    const arg = (Sentry.captureException as jest.Mock).mock.calls[0][1];
    expect(arg.extra.token).toBe('<redacted>');
    expect(arg.extra.userId).toBe('u1');
    expect(arg.extra.message).toBe('something failed');
  });

  it('falls back to captureMessage when error is not an Error instance', () => {
    logger.error('plain string error', 'string-error', { password: 's' });
    expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);
    const arg = (Sentry.captureMessage as jest.Mock).mock.calls[0][1];
    expect(arg.extra.password).toBe('<redacted>');
  });
});

describe('logger.info', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('logs in any environment (no isDev gate)', () => {
    logger.info('hello');
    expect(console.log).toHaveBeenCalledTimes(1);
  });

  it('redacts context in console output', () => {
    logger.info('with secrets', { token: 't', userId: 'u1' });
    const line = (console.log as jest.Mock).mock.calls[0][0] as string;
    expect(line).toContain('<redacted>');
    expect(line).not.toContain('"token":"t"');
    expect(line).toContain('u1');
  });

  it('adds a Sentry breadcrumb with redacted data', () => {
    logger.info('event', { access_token: 'a' });
    const arg = (Sentry.addBreadcrumb as jest.Mock).mock.calls[0][0];
    expect(arg.data.access_token).toBe('<redacted>');
    expect(arg.level).toBe('info');
  });
});

describe('createLogger', () => {
  it('returns the same shape as the default logger', () => {
    const l = createLogger('test');
    expect(typeof l.debug).toBe('function');
    expect(typeof l.info).toBe('function');
    expect(typeof l.warn).toBe('function');
    expect(typeof l.error).toBe('function');
  });

  it('namespaces the prefix in output', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    createLogger('my-mod').info('hi');
    const line = spy.mock.calls[0][0] as string;
    expect(line).toContain('[my-mod]');
    spy.mockRestore();
  });
});
