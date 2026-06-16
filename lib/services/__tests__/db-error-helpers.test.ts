import { isMissingTableError } from '../db-error-helpers';

describe('isMissingTableError', () => {
  it('returns false for null/undefined', () => {
    expect(isMissingTableError(null)).toBe(false);
    expect(isMissingTableError(undefined)).toBe(false);
  });

  it('detects the Postgres undefined_table code (42P01)', () => {
    expect(isMissingTableError({ code: '42P01', message: 'whatever' })).toBe(true);
  });

  it('detects the PostgREST schema-cache miss code (PGRST205)', () => {
    expect(isMissingTableError({ code: 'PGRST205' })).toBe(true);
  });

  it('detects a "does not exist" message without a known code', () => {
    expect(
      isMissingTableError({
        code: 'XX000',
        message: 'relation "notification_preferences" does not exist',
      })
    ).toBe(true);
  });

  it('detects a PostgREST "Could not find the table" message', () => {
    expect(
      isMissingTableError({
        message: "Could not find the table 'public.auth_events' in the schema cache",
      })
    ).toBe(true);
  });

  it('returns false for an unrelated error (connection failure)', () => {
    expect(isMissingTableError({ code: '08006', message: 'connection failure' })).toBe(false);
  });

  it('returns false for a permission/RLS error', () => {
    expect(isMissingTableError({ code: '42501', message: 'permission denied for table x' })).toBe(
      false
    );
  });
});
