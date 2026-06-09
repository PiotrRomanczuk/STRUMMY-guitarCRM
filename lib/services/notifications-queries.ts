import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export type NotificationRow = {
  id: string;
  title: string;
  body: string;
  icon: string | null;
  variant: string;
  isRead: boolean;
  createdAt: string;
};

export async function getRecentNotifications(
  userId: string,
  limit = 30
): Promise<NotificationRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('in_app_notifications')
    .select('id, title, body, icon, variant, is_read, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.warn('[notifications-queries] list error', {
      error: error.message,
      code: error.code,
    });
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    title: row.title as string,
    body: row.body as string,
    icon: (row.icon as string) ?? null,
    variant: (row.variant as string) ?? 'default',
    isRead: Boolean(row.is_read),
    createdAt: row.created_at as string,
  }));
}

export const countUnread = (rows: NotificationRow[]): number =>
  rows.filter((r) => !r.isRead).length;
