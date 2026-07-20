import '@/app/editorial-tokens.css';
import { Fraunces, Geist, Geist_Mono } from 'next/font/google';

import { createClient } from '@/lib/supabase/server';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { redirect } from 'next/navigation';
import { HistoricalCalendarSync } from '@/components/lessons/integrations/HistoricalCalendarSync';
import { CalendarWebhookControl } from '@/components/lessons/integrations/CalendarWebhookControl';
import { IntegrationsSection } from '@/components/settings/IntegrationsSection';

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

export default async function CalendarPage() {
  const { user } = await getUserWithRolesSSR();
  if (!user) {
    redirect('/sign-in?redirect=/dashboard/calendar');
  }

  const supabase = await createClient();
  const { data: googleIntegration } = await supabase
    .from('user_integrations')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('provider', 'google')
    .maybeSingle();

  const isGoogleConnected = Boolean(googleIntegration);

  return (
    <div className={`theme-editorial ${geist.variable} ${geistMono.variable} ${fraunces.variable}`}>
      <div
        style={{
          background: 'var(--ivory)',
          color: 'var(--ink)',
          minHeight: '100%',
          padding: '28px 32px 64px',
        }}
      >
        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <div
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 11,
                color: 'var(--ink-4)',
                textTransform: 'uppercase',
                letterSpacing: '.16em',
              }}
            >
              Tools
            </div>
            <h1
              style={{
                margin: '4px 0 6px',
                fontFamily: 'var(--serif)',
                fontWeight: 400,
                fontSize: 40,
                letterSpacing: '-0.02em',
                fontStyle: 'italic',
              }}
            >
              Calendar
            </h1>
            <p style={{ color: 'var(--ink-3)', fontSize: 13 }}>
              Sync your Google Calendar lessons and manage your schedule.
            </p>
          </div>

          <IntegrationsSection isGoogleConnected={isGoogleConnected} />

          {isGoogleConnected && (
            <>
              <CalendarWebhookControl />
              <HistoricalCalendarSync />
            </>
          )}

          {!isGoogleConnected && (
            <div
              style={{
                border: '1px dashed var(--rule)',
                borderRadius: 10,
                padding: 32,
                textAlign: 'center',
                color: 'var(--ink-4)',
                fontStyle: 'italic',
                fontFamily: 'var(--serif)',
                fontSize: 14,
              }}
            >
              Connect your Google Calendar above to import lessons and enable real-time sync.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
