import '@/app/editorial-tokens.css';

import { Fraunces, Geist, Geist_Mono } from 'next/font/google';
import { redirect } from 'next/navigation';

import { SettingsEditorial } from '@/components/settings/editorial/SettingsEditorial';
import { IntegrationsSection } from '@/components/settings/IntegrationsSection';
import { ApiKeyManager } from '@/components/settings/ApiKeyManager';
import { createClient } from '@/lib/supabase/server';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  weight: ['400', '500'],
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  axes: ['opsz'],
  display: 'swap',
});

const roleLabelFrom = (isAdmin: boolean, isTeacher: boolean, isStudent: boolean): string => {
  const roles: string[] = [];
  if (isAdmin) roles.push('Admin');
  if (isTeacher) roles.push('Teacher');
  if (isStudent) roles.push('Student');
  return roles.length > 0 ? roles.join(' · ') : 'No role assigned';
};

export default async function SettingsPage() {
  const { user, isAdmin, isTeacher, isStudent } = await getUserWithRolesSSR();
  if (!user) {
    redirect('/sign-in?redirect=/dashboard/settings');
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('full_name, phone, avatar_url')
    .eq('id', user.id)
    .single();

  const { data: googleIntegration } = await supabase
    .from('user_integrations')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('provider', 'google')
    .maybeSingle();

  const showIntegrations = isAdmin || isTeacher;

  return (
    <div className={`theme-editorial ${geist.variable} ${geistMono.variable} ${fraunces.variable}`}>
      <SettingsEditorial
        userId={user.id}
        email={user.email ?? ''}
        fullName={(data?.full_name as string) ?? null}
        phone={(data?.phone as string) ?? null}
        avatarUrl={(data?.avatar_url as string) ?? null}
        roleLabel={roleLabelFrom(isAdmin, isTeacher, isStudent)}
      />
      {showIntegrations && (
        <div className="mx-auto mt-8 max-w-2xl px-6">
          <IntegrationsSection isGoogleConnected={Boolean(googleIntegration)} />
        </div>
      )}
      <div className="mx-auto mt-8 max-w-2xl px-6 pb-16">
        <ApiKeyManager />
      </div>
    </div>
  );
}
