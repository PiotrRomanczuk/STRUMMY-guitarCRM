-- Restore user_settings (bucket-C table that backs the live Settings page).
-- Dropped from prod during schema drift; the settings UI/useSettings/actions
-- were silently degrading to defaults. Decision (2026-06-19): RESTORE, mirroring
-- the sync_conflicts restore. Faithful to 20260226400000_create_user_settings.sql.

CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'pl', 'es', 'de', 'fr')),
    timezone TEXT NOT NULL DEFAULT 'UTC',
    profile_visibility TEXT NOT NULL DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private', 'contacts')),
    show_email BOOLEAN NOT NULL DEFAULT false,
    show_last_seen BOOLEAN NOT NULL DEFAULT true,
    font_scheme TEXT NOT NULL DEFAULT 'geist',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own settings" ON public.user_settings;
CREATE POLICY "Users can read own settings"
    ON public.user_settings FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
CREATE POLICY "Users can insert own settings"
    ON public.user_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
CREATE POLICY "Users can update own settings"
    ON public.user_settings FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can read all settings" ON public.user_settings;
CREATE POLICY "Admins can read all settings"
    ON public.user_settings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

CREATE OR REPLACE FUNCTION public.update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

DROP TRIGGER IF EXISTS user_settings_updated_at ON public.user_settings;
CREATE TRIGGER user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_settings_updated_at();

GRANT SELECT, INSERT, UPDATE ON public.user_settings TO authenticated;

COMMENT ON TABLE public.user_settings IS 'Per-user preferences (theme, language, timezone, visibility) backing the Settings page. Restored 2026-06-19.';
