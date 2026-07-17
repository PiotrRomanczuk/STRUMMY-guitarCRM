import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { OnboardingV2 } from '@/components/v2/onboarding';
import { OnboardingV2Boundary } from '@/components/v2/onboarding/OnboardingBoundary';
import { Loader2 } from 'lucide-react';

function OnboardingLoadingFallback() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-background items-center justify-center">
      <div
        className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none"
        aria-hidden="true"
      />
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

  const firstName = user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0];

  return (
    <OnboardingV2Boundary>
      <Suspense fallback={<OnboardingLoadingFallback />}>
        <OnboardingV2 firstName={firstName} />
      </Suspense>
    </OnboardingV2Boundary>
  );
}
