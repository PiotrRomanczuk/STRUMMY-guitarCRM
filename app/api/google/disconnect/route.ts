import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGoogleOAuth2Client, stopCalendarWatch } from '@/lib/google';
import { logger } from '@/lib/logger';

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: integration } = await supabase
    .from('user_integrations')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', user.id)
    .eq('provider', 'google')
    .single();

  if (!integration) {
    return NextResponse.json({ success: true, alreadyDisconnected: true });
  }

  await stopAllWebhooks(user.id);
  await revokeGoogleCredentials(user.id, integration);

  const { error: deleteError } = await supabase
    .from('user_integrations')
    .delete()
    .eq('user_id', user.id)
    .eq('provider', 'google');

  if (deleteError) {
    logger.error('[GoogleDisconnect] Failed to delete user_integrations', {
      userId: user.id,
      error: deleteError.message,
    });
    return NextResponse.json({ error: 'Failed to disconnect Google Calendar' }, { status: 500 });
  }

  await supabase
    .from('webhook_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('provider', 'google');

  return NextResponse.json({ success: true });
}

async function stopAllWebhooks(userId: string): Promise<void> {
  const supabase = await createClient();
  const { data: subscriptions } = await supabase
    .from('webhook_subscriptions')
    .select('channel_id, resource_id')
    .eq('user_id', userId)
    .eq('provider', 'google');

  if (!subscriptions?.length) return;

  for (const sub of subscriptions) {
    try {
      await stopCalendarWatch(userId, sub.channel_id, sub.resource_id);
    } catch (err) {
      logger.warn('[GoogleDisconnect] Failed to stop webhook (continuing)', {
        userId,
        channelId: sub.channel_id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

async function revokeGoogleCredentials(
  userId: string,
  integration: {
    access_token: string | null;
    refresh_token: string | null;
    expires_at: number | null;
  }
): Promise<void> {
  if (!integration.access_token && !integration.refresh_token) return;

  try {
    const oauth2Client = getGoogleOAuth2Client();
    oauth2Client.setCredentials({
      access_token: integration.access_token ?? undefined,
      refresh_token: integration.refresh_token ?? undefined,
      expiry_date: integration.expires_at ?? undefined,
    });
    await oauth2Client.revokeCredentials();
  } catch (err) {
    logger.warn('[GoogleDisconnect] Failed to revoke credentials (continuing)', {
      userId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
