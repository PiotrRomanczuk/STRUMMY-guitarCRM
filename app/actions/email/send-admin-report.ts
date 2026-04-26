'use server';

import { getDailyBriefingStats } from '@/lib/services/song-analytics';
import { generateAdminSongReportHtml } from '@/lib/email/templates/admin-song-report';
import transporter from '@/lib/email/smtp-client';
import { logger } from '@/lib/logger';

export async function sendAdminSongReport() {
  try {
    const stats = await getDailyBriefingStats();
    const html = generateAdminSongReportHtml(stats);

    const adminEmail = process.env.GMAIL_USER;
    if (!adminEmail) {
      throw new Error('GMAIL_USER environment variable is not set');
    }

    const now = new Date();
    const weekday = now.toLocaleDateString('en-GB', { weekday: 'long' });
    const dayMonth = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });

    const info = await transporter.sendMail({
      from: `"Strummy" <${process.env.GMAIL_USER}>`,
      to: adminEmail,
      subject: `Morning Briefing — ${weekday}, ${dayMonth}`,
      html,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('[sendAdminSongReport] Failed to send report:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
