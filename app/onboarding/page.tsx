import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { OnboardingForm } from '@/components/onboarding/OnboardingForm';
import { OnboardingV2 } from '@/components/v2/onboarding';
import { OnboardingV2Boundary } from '@/components/v2/onboarding/OnboardingBoundary';
import { OnboardingStitch } from '@/components/v2/stitch/onboarding';
import { getUIVersion } from '@/lib/ui-version.server';
import { Music, Loader2 } from 'lucide-react';

function OnboardingLoadingFallback() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-background items-center justify-center">
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" aria-hidden="true" />
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
      <p className="text-sm text-muted-foreground">Loading onboarding...</p>
    </div>
  );
}

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Check if already onboarded
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_student, is_teacher, is_admin')
    .eq('id', user.id)
    .single();

  if (profile?.is_student || profile?.is_teacher || profile?.is_admin) {
    redirect('/dashboard');
  }

  const uiVersion = await getUIVersion();
  const firstName = user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0];

  if (uiVersion === 'v3') {
    return (
      <Suspense fallback={<OnboardingLoadingFallback />}>
        <OnboardingStitch firstName={firstName} />
      </Suspense>
    );
  }

  if (uiVersion === 'v2') {
    return (
      <OnboardingV2Boundary>
        <Suspense fallback={<OnboardingLoadingFallback />}>
          <OnboardingV2 firstName={firstName} />
        </Suspense>
      </OnboardingV2Boundary>
    );
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center bg-background">
      {/* Subtle background gradient */}
      <div
        className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none"
        aria-hidden="true"
      />

      {/* Mobile container */}
      <div className="relative w-full max-w-md min-h-screen flex flex-col px-6 py-8">
        {/* Branding */}
        <div className="flex flex-col items-center mb-4">
          <div className="mb-4 rounded-2xl bg-gradient-to-br from-card to-muted border border-border flex items-center justify-center shadow-lg p-4">
            <Music className="h-10 w-10 text-primary" />
          </div>
        </div>

        {/* Form */}
        <OnboardingForm user={user} />
      </div>
    </div>
  );
}
