'use client';

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Mail, Bell } from 'lucide-react';
import { NotificationPreference } from '@/types/notifications';
import { getNotificationTypeInfo } from './notification-preferences.helpers';

interface NotificationPreferencesItemProps {
  preference: NotificationPreference;
  onToggle: (enabled: boolean) => void;
  disabled?: boolean;
}

/**
 * Individual notification preference toggle item
 * Shows delivery channel badge (Email, In-App, or Both)
 */
export function NotificationPreferencesItem({
  preference,
  onToggle,
  disabled = false,
}: NotificationPreferencesItemProps) {
  const info = getNotificationTypeInfo(preference.notification_type);

  if (!info) return null;

  const deliveryChannel = 'email';

  const channelConfig = {
    email: {
      label: 'Email Only',
      icon: Mail,
      variant: 'secondary' as const,
      className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    },
    in_app: {
      label: 'In-App Only',
      icon: Bell,
      variant: 'default' as const,
      className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    },
    both: {
      label: 'Email + In-App',
      icon: Bell,
      variant: 'default' as const,
      className: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    },
  };

  const config = channelConfig[deliveryChannel];
  const Icon = config.icon;

  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-b-0 dark:border-border-dark">
      <div className="flex-1 pr-4">
        <div className="flex items-center gap-2 mb-1">
          <Label
            htmlFor={`pref-${preference.notification_type}`}
            className="text-sm font-medium cursor-pointer"
          >
            {info.label}
          </Label>
          <Badge className={config.className}>
            <Icon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
          {info.description}
        </p>
      </div>
      <Switch
        id={`pref-${preference.notification_type}`}
        checked={preference.enabled}
        onCheckedChange={onToggle}
        disabled={disabled}
        aria-label={`Toggle ${info.label}`}
      />
    </div>
  );
}
