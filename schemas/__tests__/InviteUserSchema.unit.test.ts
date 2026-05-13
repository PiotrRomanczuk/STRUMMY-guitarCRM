import { InviteUserSchema } from '@/schemas/InviteUserSchema';

describe('InviteUserSchema', () => {
  const valid = {
    email: 'invitee@example.com',
    fullName: 'Grace Hopper',
    phone: '+1 555 1234',
    role: 'student' as const,
  };

  it('accepts a fully populated valid invite', () => {
    expect(InviteUserSchema.parse(valid)).toMatchObject(valid);
  });

  it.each(['student', 'teacher', 'admin'])('accepts role %s', (role) => {
    expect(InviteUserSchema.parse({ ...valid, role }).role).toBe(role);
  });

  it('rejects unknown roles', () => {
    expect(() => InviteUserSchema.parse({ ...valid, role: 'guest' })).toThrow(/role/i);
  });

  it('requires a valid email', () => {
    expect(() => InviteUserSchema.parse({ ...valid, email: 'not-an-email' })).toThrow(/email/i);
  });

  it('requires a non-empty fullName', () => {
    expect(() => InviteUserSchema.parse({ ...valid, fullName: '' })).toThrow(
      /Full name is required/
    );
  });

  it('caps fullName at 200 characters', () => {
    expect(() => InviteUserSchema.parse({ ...valid, fullName: 'a'.repeat(201) })).toThrow(
      /Full name too long/
    );
  });

  it('accepts an empty phone string', () => {
    const parsed = InviteUserSchema.parse({ ...valid, phone: '' });
    expect(parsed.phone).toBe('');
  });

  it('accepts an undefined phone', () => {
    const { phone, ...rest } = valid;
    void phone;
    const parsed = InviteUserSchema.parse(rest);
    expect(parsed.phone).toBeUndefined();
  });

  it('rejects malformed phone numbers', () => {
    expect(() => InviteUserSchema.parse({ ...valid, phone: 'phone-number' })).toThrow(
      /Valid phone/
    );
  });
});
