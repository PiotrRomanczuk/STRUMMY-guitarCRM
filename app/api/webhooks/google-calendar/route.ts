import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchAndSyncRecentEvents } from '@/lib/services/google-calendar-sync';
import { logger } from '@/lib/logger';

function validateToken(req: NextRequest): boolean {
  const secret = process.env.GOOGLE_CALENDAR_WEBHOOK_SECRET;
  if (!secret) {
    // Allow skip only when an explicit dev flag is set — never silently in dev.
    if (process.env.CALENDAR_WEBHOOK_SKIP_TOKEN === 'true') {
      logger.warn('[Webhook] Token validation skipped (CALENDAR_WEBHOOK_SKIP_TOKEN=true)');
      return true;
    }
    logger.error('[Webhook] GOOGLE_CALENDAR_WEBHOOK_SECRET not configured');
    return false;
  }
  const token = req.headers.get('x-goog-channel-token');
  return token === secret;
}

type ResourceState = 'sync' | 'exists' | 'not_exists';

function parseResourceState(value: string | null): ResourceState | null {
  if (value === 'sync' || value === 'exists' || value === 'not_exists') return value;
  return null;
}

export async function POST(req: NextRequest) {
  const channelId = req.headers.get('x-goog-channel-id');
  const resourceId = req.headers.get('x-goog-resource-id');
  const resourceState = req.headers.get('x-goog-resource-state');

  logger.info('[Webhook] Received Google Calendar notification', {
    channelId,
    resourceId,
    resourceState,
  });

  if (!channelId || !resourceId) {
    return NextResponse.json({ error: 'Missing headers' }, { status: 400 });
  }

  // Validate webhook secret token to prevent spoofed notifications
  if (!validateToken(req)) {
    logger.warn('[Webhook] Invalid token, rejecting');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Validate and branch on x-goog-resource-state
  const state = parseResourceState(resourceState);

  if (state === 'sync') {
    logger.info('[Webhook] Sync verification acknowledged');
    return NextResponse.json({ status: 'ok' });
  }

  if (state === null) {
    logger.warn('[Webhook] Unknown resource-state, ignoring', { resourceState });
    return NextResponse.json({ status: 'ignored' });
  }

  // state is 'exists' | 'not_exists' — proceed with sync
  // Use admin client — webhook POSTs carry no Supabase session cookies
  const supabase = createAdminClient();

  // Find the user associated with this channel
  const { data: subscription, error } = await supabase
    .from('webhook_subscriptions')
    .select('user_id')
    .eq('channel_id', channelId)
    .eq('resource_id', resourceId)
    .single();

  if (error || !subscription) {
    logger.error('[Webhook] Subscription not found:', {
      channelId,
      resourceId,
      error: error?.message,
    });
    // Return 200 to stop Google from retrying if it's an invalid channel
    return NextResponse.json({ status: 'ignored' });
  }

  logger.info('[Webhook] Subscription matched, triggering sync', {
    userId: subscription.user_id,
  });

  // Trigger sync for the user
  // We don't await this to return quickly to Google
  fetchAndSyncRecentEvents(subscription.user_id).catch((err) => {
    logger.error('[Webhook] Background sync failed:', err);
  });

  return NextResponse.json({ status: 'processed' });
}
