'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, Bell } from 'lucide-react';
import { useNotificationPreferences } from './useNotificationPreferences';
import { NotificationPreferencesItem } from './NotificationPreferences.Item';
import {
  groupPreferencesByCategory,
  areAllPreferencesEnabled,
  sortPreferences,
} from './notification-preferences.helpers';
import { NOTIFICATION_CATEGORY_INFO } from '@/types/notifications';

/**
 * Main notification preferences component
 * Displays notification preferences grouped by category with toggle controls
 */
export default function NotificationPreferences({ userId }: { userId: string }) {
  const { preferences, isLoading, error, togglePreference, toggleAll } =
    useNotificationPreferences(userId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 sm:p-12">
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary dark:text-primary-dark" />
            <p className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
              Loading notification preferences...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const sortedPreferences = sortPreferences(preferences);
  const groupedPreferences = groupPreferencesByCategory(sortedPreferences);
  const allEnabled = areAllPreferencesEnabled(preferences);

  const categories = Object.keys(NOTIFICATION_CATEGORY_INFO) as Array<
    keyof typeof NOTIFICATION_CATEGORY_INFO
  >;

  return (
    <div className="space-y-6">
      {/* Enable/Disable All Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary dark:text-primary-dark" />
              <CardTitle>Email Notifications</CardTitle>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="toggle-all" className="text-sm font-medium cursor-pointer">
                {allEnabled ? 'Disable All' : 'Enable All'}
              </Label>
              <Switch
                id="toggle-all"
                checked={allEnabled}
                onCheckedChange={toggleAll}
                aria-label="Toggle all notifications"
              />
            </div>
          </div>
          <CardDescription>
            Manage your email notification preferences for different types of updates and alerts.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Category Groups */}
      {categories.map((category) => {
        const categoryInfo = NOTIFICATION_CATEGORY_INFO[category];
        const categoryPrefs = groupedPreferences[category] || [];

        if (categoryPrefs.length === 0) return null;

        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-lg">{categoryInfo.name}</CardTitle>
              <CardDescription>{categoryInfo.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                {categoryPrefs.map((pref) => (
                  <NotificationPreferencesItem
                    key={pref.id}
                    preference={pref}
                    onToggle={(enabled) => togglePreference(pref.notification_type, enabled)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
