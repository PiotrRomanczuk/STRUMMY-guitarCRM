-- Migration: avatars storage bucket + policies (IDA-2)
-- ============================================================================
-- Blueprint gap IDA-2 (docs/app-blueprint/01-identity-access.md).
--
-- NOTE: this local dev stack (StudentManager on uwh) has no storage-api
-- container provisioned — the `storage` schema does not exist here at all
-- (confirmed: to_regclass('storage.buckets') is null). This migration is
-- correct and ready to apply wherever Storage IS running (StrummyProd,
-- Cloud), but could not be applied or verified against this stack. Spinning
-- up a new Docker service on a shared host is a bigger, riskier action than
-- an in-place schema migration and wasn't done unilaterally here — flagging
-- for a deliberate decision instead.
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2 MB, mirrors lib/storage/avatar.ts's MAX_AVATAR_BYTES
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Public read: avatars are meant to be visible to anyone (profile pictures).
CREATE POLICY avatars_public_read ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

-- Owner-write: a user may only write/overwrite objects under their own
-- user-id-prefixed path (lib/storage/avatar.ts's avatarObjectPath ensures
-- uploads always go to `${userId}/avatar.<ext>`), so this also satisfies
-- "another user cannot overwrite my object" without a separate ownership
-- column on storage.objects.
CREATE POLICY avatars_owner_write ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY avatars_owner_update ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY avatars_owner_delete ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
