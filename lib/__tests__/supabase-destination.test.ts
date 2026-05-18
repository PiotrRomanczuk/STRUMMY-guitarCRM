jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(),
}));

import { __internal } from '../logger/supabase-destination';

const { pinoLogToRow, pinoLevelToName, serializeError } = __internal;

describe('pinoLevelToName', () => {
  it.each([
    [20, 'debug'],
    [30, 'info'],
    [40, 'warn'],
    [50, 'error'],
    [60, 'error'],
  ])('maps pino level %i → %s', (level, expected) => {
    expect(pinoLevelToName(level)).toBe(expected);
  });

  it('returns null for trace and below (we have no trace enum)', () => {
    expect(pinoLevelToName(10)).toBeNull();
    expect(pinoLevelToName(5)).toBeNull();
  });
});

describe('serializeError', () => {
  it('returns null for nullish', () => {
    expect(serializeError(null)).toBeNull();
    expect(serializeError(undefined)).toBeNull();
  });

  it('extracts type/message/stack from an Error-shaped object', () => {
    const out = serializeError({ type: 'Error', message: 'boom', stack: 'stack' });
    expect(out).toEqual({ type: 'Error', message: 'boom', stack: 'stack' });
  });

  it('handles bare string errors', () => {
    const out = serializeError('plain');
    expect(out).toEqual({ type: 'unknown', message: 'plain' });
  });

  it('defaults type to "Error" when missing', () => {
    const out = serializeError({ message: 'no type' });
    expect(out?.type).toBe('Error');
  });
});

describe('pinoLogToRow', () => {
  it('returns null for sub-debug levels', () => {
    expect(pinoLogToRow({ level: 5 })).toBeNull();
  });

  it('maps a basic warn line', () => {
    const row = pinoLogToRow({
      level: 40,
      time: '2026-05-18T00:00:00.000Z',
      prefix: 'API',
      msg: 'slow query',
      requestId: 'req-1',
      userId: 'u-1',
      duration_ms: 1234,
    });
    expect(row).toEqual({
      occurred_at: '2026-05-18T00:00:00.000Z',
      level: 'warn',
      prefix: 'API',
      message: 'slow query',
      request_id: 'req-1',
      user_id: 'u-1',
      context: { duration_ms: 1234 },
      error: null,
    });
  });

  it('attaches serialized error on error-level rows', () => {
    const row = pinoLogToRow({
      level: 50,
      time: '2026-05-18T00:00:00.000Z',
      prefix: 'cron:foo',
      msg: 'job failed',
      err: { type: 'Error', message: 'nope', stack: '…' },
    });
    expect(row?.level).toBe('error');
    expect(row?.error).toEqual({ type: 'Error', message: 'nope', stack: '…' });
  });

  it('omits stdLib pino keys (pid, hostname, app) from context', () => {
    const row = pinoLogToRow({
      level: 40,
      time: '2026-05-18T00:00:00.000Z',
      prefix: 'x',
      msg: 'm',
      pid: 1,
      hostname: 'h',
      app: 'strummy',
      keepMe: 'yes',
    });
    expect(row?.context).toEqual({ keepMe: 'yes' });
    expect(row?.context).not.toHaveProperty('pid');
    expect(row?.context).not.toHaveProperty('hostname');
    expect(row?.context).not.toHaveProperty('app');
  });

  it('falls back to defaults when prefix/message are missing', () => {
    const row = pinoLogToRow({
      level: 40,
      time: '2026-05-18T00:00:00.000Z',
    });
    expect(row?.prefix).toBe('app');
    expect(row?.message).toBe('');
  });

  it('returns null context when no extra fields present', () => {
    const row = pinoLogToRow({
      level: 40,
      time: '2026-05-18T00:00:00.000Z',
      prefix: 'x',
      msg: 'm',
    });
    expect(row?.context).toBeNull();
  });

  it('converts numeric time to ISO string', () => {
    const ts = Date.parse('2026-05-18T00:00:00.000Z');
    const row = pinoLogToRow({ level: 40, time: ts, prefix: 'x', msg: 'm' });
    expect(row?.occurred_at).toBe('2026-05-18T00:00:00.000Z');
  });
});
