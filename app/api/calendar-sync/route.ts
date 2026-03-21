import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getGoogleOAuth2Client } from '@/lib/google';
import { google } from 'googleapis';
import { isGuitarLesson } from '@/lib/calendar/calendar-utils';
import { extractStudentFromAttendees } from '@/lib/services/calendar-bulk-import';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * SSE endpoint for calendar sync with live progress.
 * Scoped to last 30 days + 7 days forward.
 * Streams: { phase, current, total, detail } events.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // Phase 1: Auth + fetch
        send({ phase: 'connecting', detail: 'Authenticating with Google...' });

        const { data: integration, error: intError } = await supabase
          .from('user_integrations')
          .select('access_token, refresh_token, expires_at')
          .eq('user_id', user.id)
          .eq('provider', 'google')
          .single();

        if (intError || !integration) {
          send({ phase: 'error', detail: 'Google Calendar not connected' });
          controller.close();
          return;
        }

        const oauth2Client = getGoogleOAuth2Client();
        oauth2Client.setCredentials({
          access_token: integration.access_token,
          refresh_token: integration.refresh_token,
          expiry_date: integration.expires_at,
        });

        // Refresh token if expired
        if (integration.expires_at && integration.expires_at < Date.now()) {
          const { credentials } = await oauth2Client.refreshAccessToken();
          await supabase
            .from('user_integrations')
            .update({
              access_token: credentials.access_token,
              expires_at: credentials.expiry_date,
              updated_at: new Date().toISOString(),
              ...(credentials.refresh_token && { refresh_token: credentials.refresh_token }),
            })
            .eq('user_id', user.id)
            .eq('provider', 'google');
          oauth2Client.setCredentials(credentials);
        }

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        send({ phase: 'fetching', detail: 'Fetching calendar events...' });

        const now = new Date();
        const timeMin = new Date(now);
        timeMin.setDate(timeMin.getDate() - 30);
        const timeMax = new Date(now);
        timeMax.setDate(timeMax.getDate() + 7);

        const response = await calendar.events.list({
          calendarId: 'primary',
          timeMin: timeMin.toISOString(),
          timeMax: timeMax.toISOString(),
          singleEvents: true,
          orderBy: 'startTime',
        });

        const allEvents = response.data.items || [];
        const events = allEvents.filter(
          (e) => isGuitarLesson(e) && e.id && e.start?.dateTime
        );

        send({
          phase: 'syncing',
          current: 0,
          total: events.length,
          detail: `Found ${events.length} guitar lessons (${allEvents.length} total events)`,
        });

        if (events.length === 0) {
          send({ phase: 'done', imported: 0, skipped: 0, updated: 0 });
          controller.close();
          return;
        }

        // Phase 2: Sync each event
        const admin = createAdminClient();
        const teacherEmail = user.email || '';
        let imported = 0;
        let skipped = 0;
        let updated = 0;

        for (let i = 0; i < events.length; i++) {
          const event = events[i];
          const student = extractStudentFromAttendees(
            event.attendees as Array<{ email: string; displayName?: string }> | undefined,
            teacherEmail
          );

          const title = (event.summary || 'Lesson').replace(' and Piotr Romańczuk', '');

          if (!student?.email) {
            skipped++;
            send({
              phase: 'syncing',
              current: i + 1,
              total: events.length,
              detail: `Skipped: ${title} (no student attendee)`,
              imported,
              skipped,
              updated,
            });
            continue;
          }

          // Dedup check
          const { data: existing } = await admin
            .from('lessons')
            .select('id')
            .eq('google_event_id', event.id!)
            .single();

          if (existing) {
            // Update existing lesson
            await admin
              .from('lessons')
              .update({
                title: event.summary || 'Lesson',
                scheduled_at: event.start!.dateTime!,
              })
              .eq('id', existing.id);

            updated++;
            send({
              phase: 'syncing',
              current: i + 1,
              total: events.length,
              detail: `Updated: ${title} — ${student.email}`,
              imported,
              skipped,
              updated,
            });
            continue;
          }

          // Find or create student
          const { data: profile } = await admin
            .from('profiles')
            .select('id')
            .eq('email', student.email)
            .single();

          let studentId: string;
          if (profile) {
            studentId = profile.id;
          } else {
            // Create shadow profile
            const [firstName, ...lastParts] = (student.displayName || student.email.split('@')[0]).split(' ');
            const { data: newProfile, error: profileErr } = await admin
              .from('profiles')
              .insert({
                email: student.email,
                full_name: `${firstName} ${lastParts.join(' ')}`.trim(),
                is_student: true,
                is_teacher: false,
                is_admin: false,
                is_shadow: true,
                user_id: null,
              })
              .select('id')
              .single();

            if (profileErr || !newProfile) {
              skipped++;
              send({
                phase: 'syncing',
                current: i + 1,
                total: events.length,
                detail: `Failed: ${title} — couldn't create student`,
                imported,
                skipped,
                updated,
              });
              continue;
            }
            studentId = newProfile.id;
          }

          // Get next lesson number
          const { data: lastLesson } = await admin
            .from('lessons')
            .select('lesson_teacher_number')
            .eq('teacher_id', user.id)
            .eq('student_id', studentId)
            .order('lesson_teacher_number', { ascending: false })
            .limit(1)
            .single();

          const nextNumber = (lastLesson?.lesson_teacher_number || 0) + 1;

          const { error: insertErr } = await admin.from('lessons').insert({
            teacher_id: user.id,
            student_id: studentId,
            title: event.summary || 'Lesson',
            scheduled_at: event.start!.dateTime!,
            google_event_id: event.id,
            lesson_teacher_number: nextNumber,
            status: new Date(event.start!.dateTime!) < now ? 'COMPLETED' : 'SCHEDULED',
          });

          if (insertErr) {
            skipped++;
            logger.error('[CalendarSync SSE] Insert failed:', insertErr);
            send({
              phase: 'syncing',
              current: i + 1,
              total: events.length,
              detail: `Failed: ${title} — ${insertErr.message}`,
              imported,
              skipped,
              updated,
            });
          } else {
            imported++;
            send({
              phase: 'syncing',
              current: i + 1,
              total: events.length,
              detail: `Imported: ${title} — ${student.email}`,
              imported,
              skipped,
              updated,
            });
          }
        }

        send({ phase: 'done', imported, skipped, updated });
      } catch (err) {
        logger.error('[CalendarSync SSE] Error:', err);
        send({
          phase: 'error',
          detail: err instanceof Error ? err.message : 'Sync failed',
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
