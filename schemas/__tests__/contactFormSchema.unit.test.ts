import { contactFormSchema } from '@/schemas/contactFormSchema';

describe('contactFormSchema', () => {
  const valid = {
    name: 'Linus',
    email: 'linus@example.com',
    message: 'Hello there, this is a contact message.',
  };

  it('accepts a valid submission', () => {
    expect(contactFormSchema.parse(valid)).toMatchObject(valid);
  });

  it('honeypot is optional and stripped when omitted', () => {
    expect(contactFormSchema.parse(valid).honeypot).toBeUndefined();
  });

  it('honeypot is preserved when provided (used for spam detection upstream)', () => {
    const parsed = contactFormSchema.parse({ ...valid, honeypot: 'bot' });
    expect(parsed.honeypot).toBe('bot');
  });

  it('rejects an empty name', () => {
    expect(() => contactFormSchema.parse({ ...valid, name: '' })).toThrow(/Name is required/);
  });

  it('caps name at 100 characters', () => {
    expect(() => contactFormSchema.parse({ ...valid, name: 'a'.repeat(101) })).toThrow(
      /Name too long/
    );
  });

  it('requires a valid email', () => {
    expect(() => contactFormSchema.parse({ ...valid, email: 'no-at-sign' })).toThrow(/valid email/);
  });

  it('requires a message of at least 10 characters', () => {
    expect(() => contactFormSchema.parse({ ...valid, message: 'too short' })).toThrow(
      /at least 10/
    );
  });

  it('caps message at 500 characters', () => {
    expect(() => contactFormSchema.parse({ ...valid, message: 'm'.repeat(501) })).toThrow(
      /Message too long/
    );
  });
});
