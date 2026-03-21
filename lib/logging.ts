import { supabase } from '@/lib/supabase';
import {
  ActivityLogInputSchema,
  type ActivityLogInput,
  type ActivityLog,
} from '@/schemas/ActivityLogSchema';
import { logger } from '@/lib/logger';

type ActivityData = Record<string, string | number | boolean | null>;
type ActivityDataInput = Record<string, string | number | boolean | null | undefined>;

function getSessionId(): string {
  if (typeof window === 'undefined') return 'server-session';
  const stored = localStorage.getItem('session_id');
  if (stored) return stored;
  const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('session_id', newId);
  return newId;
}

function prepareActivityData(eventName: string, data?: ActivityDataInput): ActivityData {
  const baseData: ActivityData = {
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    sessionId: getSessionId(),
  };
  if (data) {
    // Filter out undefined values to satisfy ActivityData type
    const filtered: ActivityData = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        filtered[key] = value;
      }
    }
    return { ...baseData, ...filtered };
  }
  return baseData;
}

export async function logActivity(
  activity: ActivityLogInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const validated = ActivityLogInputSchema.parse(activity);
    const { error } = await supabase.from('user_activity_logs').insert([validated]);
    if (error) {
      logger.error('Error logging activity:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (error) {
    logger.error('Error in logActivity:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function logPageView(
  pagePath: string,
  pageTitle?: string
): Promise<{ success: boolean; error?: string }> {
  const data = prepareActivityData('Page View', {
    page_path: pagePath,
    page_title: pageTitle || document.title,
  });
  return logActivity({
    activity_type: 'page_view',
    event_name: `Page viewed: ${pageTitle || pagePath}`,
    page_url: typeof window !== 'undefined' ? window.location.href : '',
    additional_data: data,
  });
}

export async function logButtonClick(
  buttonId: string,
  buttonText?: string,
  data?: ActivityDataInput
): Promise<{ success: boolean; error?: string }> {
  const preparedData = prepareActivityData(`Button clicked: ${buttonText || buttonId}`, {
    button_id: buttonId,
    button_text: buttonText,
    ...data,
  });
  return logActivity({
    activity_type: 'button_click',
    event_name: `Button clicked: ${buttonText || buttonId}`,
    page_url: typeof window !== 'undefined' ? window.location.href : '',
    additional_data: preparedData,
  });
}

export async function logLinkClick(
  linkHref: string,
  linkText?: string
): Promise<{ success: boolean; error?: string }> {
  const preparedData = prepareActivityData(`Link clicked: ${linkText || linkHref}`, {
    link_href: linkHref,
    link_text: linkText,
  });
  return logActivity({
    activity_type: 'link_click',
    event_name: `Link clicked: ${linkText || linkHref}`,
    page_url: typeof window !== 'undefined' ? window.location.href : '',
    additional_data: preparedData,
  });
}

export async function logFormSubmit(
  formId: string,
  formData?: ActivityDataInput
): Promise<{ success: boolean; error?: string }> {
  const preparedData = prepareActivityData(`Form submitted: ${formId}`, {
    form_id: formId,
    ...formData,
  });
  return logActivity({
    activity_type: 'form_submit',
    event_name: `Form submitted: ${formId}`,
    page_url: typeof window !== 'undefined' ? window.location.href : '',
    additional_data: preparedData,
  });
}

export async function logFormChange(
  formId: string,
  fieldName: string,
  fieldValue?: string | number | boolean | null
): Promise<{ success: boolean; error?: string }> {
  const preparedData = prepareActivityData(`Form field changed: ${fieldName}`, {
    form_id: formId,
    field_name: fieldName,
    field_value: fieldValue,
  });
  return logActivity({
    activity_type: 'form_change',
    event_name: `Form field changed: ${fieldName}`,
    page_url: typeof window !== 'undefined' ? window.location.href : '',
    additional_data: preparedData,
  });
}

export async function getUserActivityLogs(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ success: boolean; data?: ActivityLog[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('user_activity_logs')
      .select('id, user_id, activity_type, event_name, event_description, page_url, element_id, element_class, element_text, additional_data, user_agent, ip_address, referer, session_id, timestamp, created_at')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) {
      logger.error('Error fetching activity logs:', error);
      return { success: false, error: error.message };
    }
    return { success: true, data: data as ActivityLog[] };
  } catch (error) {
    logger.error('Error in getUserActivityLogs:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getUserActivityStats(
  userId: string,
  days: number = 7
): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const { data, error } = await supabase
      .from('user_activity_logs')
      .select('activity_type, event_name')
      .eq('user_id', userId)
      .gte('timestamp', startDate.toISOString());
    if (error) {
      logger.error('Error fetching activity stats:', error);
      return { success: false, error: error.message };
    }
    const stats = {
      total_events: data?.length || 0,
      events_by_type: {} as Record<string, number>,
      events_by_name: {} as Record<string, number>,
    };
    data?.forEach((log: { activity_type: string; event_name: string }) => {
      stats.events_by_type[log.activity_type] = (stats.events_by_type[log.activity_type] || 0) + 1;
      stats.events_by_name[log.event_name] = (stats.events_by_name[log.event_name] || 0) + 1;
    });
    return { success: true, data: stats };
  } catch (error) {
    logger.error('Error in getUserActivityStats:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function deleteOldActivityLogs(
  beforeDate: Date
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const { data: countData, error: countError } = await supabase
      .from('user_activity_logs')
      .select('id', { count: 'exact' })
      .lt('created_at', beforeDate.toISOString());
    if (countError) return { success: false, error: countError.message };
    const { error: deleteError } = await supabase
      .from('user_activity_logs')
      .delete()
      .lt('created_at', beforeDate.toISOString());
    if (deleteError) return { success: false, error: deleteError.message };
    return { success: true, count: countData?.length || 0 };
  } catch (error) {
    logger.error('Error in deleteOldActivityLogs:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
