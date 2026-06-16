'use client';

import {
  useProfileData,
  ProfileHeader,
  ProfileAlert,
  ProfileLoadingState,
  ProfileForm,
  SessionInfo,
  EmailChangeForm,
  AccountDeletionDialog,
  LinkedAccounts,
} from '@/components/profile';
import { redirect } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

interface ProfilePageClientProps {
  userId: string;
  userEmail?: string;
  deletionScheduledFor?: string | null;
}

export default function ProfilePageClient({
  userId,
  userEmail,
  deletionScheduledFor,
}: ProfilePageClientProps) {
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
  } = useProfileData({
    id: userId,
  });

  const { data: profileExtra } = useQuery({
    queryKey: ['profile-extra', userId],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('profiles')
        .select('email, deletion_scheduled_for')
        .eq('id', userId)
        .single();
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const email = profileExtra?.email ?? userEmail;
  const deletion = profileExtra?.deletion_scheduled_for ?? deletionScheduledFor;

  if (loading) {
    return <ProfileLoadingState loading={loading} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-2xl">
        <ProfileHeader />
        {error && <ProfileAlert type="error" message={error.message} />}
        {success && <ProfileAlert type="success" message="Profile updated successfully" />}
        <ProfileForm
          formData={formData}
          userEmail={email}
          errors={validationErrors}
          saving={saving}
          onSubmit={handleSubmit}
          onChange={setFormData}
          onBlur={handleBlur}
          onCancel={() => redirect('/dashboard')}
        />

        <div className="mt-8 space-y-4">
          <SessionInfo userId={userId} />
          <EmailChangeForm currentEmail={email} />
          <LinkedAccounts />
          <AccountDeletionDialog deletionScheduledFor={deletion} />
        </div>
      </div>
    </div>
  );
}
