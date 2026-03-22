'use client';

import { lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useLayoutMode } from '@/hooks/use-is-widescreen';
import { useProfileData } from '@/components/profile/hooks/useProfileData';
import { ProfileMobile } from './Profile.Mobile';
import { Spinner } from '@/components/ui/spinner';
import type { ProfileEdit } from '@/schemas/ProfileSchema';

const ProfileDesktop = lazy(() => import('./Profile.Desktop'));

export interface ProfileV2Props {
  formData: ProfileEdit;
  userEmail?: string;
  validationErrors: Record<string, string>;
  saving: boolean;
  success: boolean;
  error: Error | null;
  onChange: (data: ProfileEdit) => void;
  onBlur: (field: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

interface ProfileV2WrapperProps {
  userId: string;
  userEmail?: string;
}

/**
 * v2 Profile editor component.
 * Mobile: Card-based form in MobilePageShell.
 * Desktop: Centered two-column form.
 *
 * Reuses the existing `useProfileData` hook from v1.
 */
export function ProfileV2({ userId, userEmail }: ProfileV2WrapperProps) {
  const mode = useLayoutMode();
  const router = useRouter();
  const {
    loading,
    saving,
    error,
    success,
    formData,
    validationErrors,
    setFormData,
    handleBlur,
    handleSubmit,
  } = useProfileData({ id: userId });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">Loading your profile...</p>
      </div>
    );
  }

  const props: ProfileV2Props = {
    formData,
    userEmail,
    validationErrors,
    saving,
    success,
    error: error instanceof Error
      ? error
      : error
        ? new Error(
            (error as { message?: string }).message ?? JSON.stringify(error)
          )
        : null,
    onChange: setFormData,
    onBlur: handleBlur,
    onSubmit: handleSubmit,
    onCancel: () => router.back(),
  };

  if (mode === 'mobile') return <ProfileMobile {...props} />;

  return (
    <Suspense fallback={<ProfileMobile {...props} />}>
      <ProfileDesktop {...props} />
    </Suspense>
  );
}
