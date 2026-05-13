import { UserSettingsSchema, UserSettingsUpdateSchema } from '@/schemas/SettingsSchema';

describe('UserSettingsSchema', () => {
  it('applies all defaults for an empty input', () => {
    const parsed = UserSettingsSchema.parse({});
    expect(parsed).toEqual({
      emailNotifications: true,
      pushNotifications: false,
      lessonReminders: true,
      theme: 'system',
      language: 'en',
      timezone: 'UTC',
      profileVisibility: 'public',
      showEmail: false,
      showLastSeen: true,
    });
  });

  it.each(['light', 'dark', 'system'])('accepts theme %s', (theme) => {
    expect(UserSettingsSchema.parse({ theme }).theme).toBe(theme);
  });

  it('rejects unknown theme values', () => {
    expect(() => UserSettingsSchema.parse({ theme: 'midnight' })).toThrow();
  });

  it.each(['en', 'pl', 'es', 'de', 'fr'])('accepts language %s', (lang) => {
    expect(UserSettingsSchema.parse({ language: lang }).language).toBe(lang);
  });

  it('rejects unsupported languages', () => {
    expect(() => UserSettingsSchema.parse({ language: 'jp' })).toThrow();
  });

  it.each(['public', 'private', 'contacts'])('accepts profileVisibility %s', (vis) => {
    expect(UserSettingsSchema.parse({ profileVisibility: vis }).profileVisibility).toBe(vis);
  });
});

describe('UserSettingsUpdateSchema', () => {
  it('allows updating a single field (other fields fill from their defaults)', () => {
    const parsed = UserSettingsUpdateSchema.parse({ theme: 'dark' });
    expect(parsed.theme).toBe('dark');
    expect(parsed.language).toBe('en');
  });

  it('allows an empty update payload (zod still applies field defaults under .partial())', () => {
    // zod's .partial() makes fields optional but does not strip .default()
    // values, so an empty payload still expands to the full default settings.
    const parsed = UserSettingsUpdateSchema.parse({});
    expect(parsed).toMatchObject({
      emailNotifications: true,
      theme: 'system',
      language: 'en',
    });
  });

  it('still validates field shape on partial updates', () => {
    expect(() => UserSettingsUpdateSchema.parse({ language: 'jp' })).toThrow();
  });
});
