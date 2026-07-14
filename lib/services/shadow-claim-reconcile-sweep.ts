import { createAdminClient } from '@/lib/supabase/admin';
import { reconcileCalendarForStudent } from '@/lib/services/calendar-reconcile';
import { createLogger } from '@/lib/logger';

const log = createLogger('shadow-claim-reconcile-sweep');

export interface SweepResult {
  scanned: number;
  reconciled: number;
  failed: number;
}

/** auth_events is not in the generated DB types (see lib/auth/auth-event-logger.ts). */
interface ShadowLinkEvent {
  id: string;
  user_id: string | null;
  metadata: Record<string, unknown> | null;
}

const SWEEP_WINDOW_DAYS = 14;

/**
 * Spec 06.3, trigger-path half — signup/OAuth claims run inside the
 * `handle_new_user` trigger, which cannot call Google. `claim_shadow_profile()`
 * logs a durable `shadow_link_completed` auth event instead; this sweep (run
 * from the dispatcher cron alongside calendar sync) picks up events not yet
 * marked `calendar_reconciled_at` and swaps future calendar attendees to the
 * real email.
 *
 * Idempotent: reconcile is a no-op when attendees are already correct, and
 * each fully-successful event is stamped so it is not re-scanned; partial
 * failures stay unstamped and retry next sweep. Admin-path links (which
 * already reconcile synchronously in the route) get at most one redundant
 * no-op pass here.
 *
 * No claim/lock before processing: overlapping runs may reconcile the same
 * event twice, which is safe ONLY because reconcileEventAttendee's PATCH is
 * a full-replace (see its INVARIANT comment in lib/google.ts).
 */
export async function sweepShadowClaimReconciles(limit = 20): Promise<SweepResult> {
  const admin = createAdminClient();
  const result: SweepResult = { scanned: 0, reconciled: 0, failed: 0 };

  const since = new Date(Date.now() - SWEEP_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await admin
    .from('auth_events' as never)
    .select('id, user_id, metadata')
    .eq('event_type', 'shadow_link_completed')
    .gte('occurred_at', since)
    .is('metadata->calendar_reconciled_at', null)
    .order('occurred_at', { ascending: true })
    .limit(limit);

  if (error) {
    log.error('Sweep: failed to query shadow_link_completed events', error);
    return result;
  }
  const events = (data ?? []) as unknown as ShadowLinkEvent[];

  for (const event of events) {
    result.scanned += 1;
    if (!event.user_id) continue;

    try {
      const reconcile = await reconcileCalendarForStudent(event.user_id);

      // reconcileCalendarForStudent never throws for per-lesson Google
      // failures — it reports them in `failed`. Only stamp the event when
      // every lesson succeeded; otherwise leave it for the next sweep.
      if (reconcile.failed > 0) {
        result.failed += 1;
        log.warn('Sweep: partial reconcile, leaving event unstamped for retry', {
          eventId: event.id,
          userId: event.user_id,
          ...reconcile,
        });
        continue;
      }
      result.reconciled += 1;

      const metadata = {
        ...(event.metadata ?? {}),
        calendar_reconciled_at: new Date().toISOString(),
        calendar_reconcile_result: { ...reconcile },
      };
      const { error: updateError } = await admin
        .from('auth_events' as never)
        .update({ metadata } as never)
        .eq('id', event.id);
      if (updateError) {
        log.error('Sweep: failed to stamp event metadata', updateError, { eventId: event.id });
      }
    } catch (reconcileError) {
      // Leave the event unstamped so the next sweep retries it.
      result.failed += 1;
      log.error('Sweep: reconcile failed', reconcileError, {
        eventId: event.id,
        userId: event.user_id,
      });
    }
  }

  if (result.scanned > 0) {
    log.info('Shadow-claim reconcile sweep complete', { ...result });
  }
  return result;
}
