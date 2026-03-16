'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { SettingsSection, ToggleSetting, SelectSetting } from './SettingsComponents';
import { UIVersionToggle } from '@/components/settings/UIVersionToggle';
import type { UserSettings } from '@/schemas/SettingsSchema';

interface NotificationsSectionProps {
  settings: UserSettings;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
}

export function NotificationsSection({ settings, updateSetting }: NotificationsSectionProps) {
  return (
    <SettingsSection
      title="Notifications"
      description="Manage how you receive updates and reminders"
    >
      <ToggleSetting
        id="emailNotifications"
        label="Email Notifications"
        description="Receive updates and news via email"
        checked={settings.emailNotifications}
        onChange={(checked) => updateSetting('emailNotifications', checked)}
      />
      <ToggleSetting
        id="pushNotifications"
        label="Push Notifications"
        description="Get real-time notifications in your browser"
        checked={settings.pushNotifications}
        onChange={(checked) => updateSetting('pushNotifications', checked)}
      />
      <ToggleSetting
        id="lessonReminders"
        label="Lesson Reminders"
        description="Receive reminders before scheduled lessons"
        checked={settings.lessonReminders}
        onChange={(checked) => updateSetting('lessonReminders', checked)}
      />

      <div className="pt-4">
        <Link href="/dashboard/settings/notifications">
          <Button variant="outline" className="w-full sm:w-auto">
            Advanced Notification Settings
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </SettingsSection>
  );
}

interface AppearanceSectionProps {
  settings: UserSettings;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
}

export function AppearanceSection({ settings, updateSetting }: AppearanceSectionProps) {
  return (
    <SettingsSection title="Appearance" description="Customize how the app looks and feels">
      <SelectSetting
        id="theme"
        label="Theme"
        description="Choose your preferred color scheme"
        value={settings.theme}
        options={[
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
          { value: 'system', label: 'System Default' },
        ]}
        onChange={(value) => updateSetting('theme', value as 'light' | 'dark' | 'system')}
      />
      <SelectSetting
        id="language"
        label="Language"
        description="Select your preferred language"
        value={settings.language}
        options={[
          { value: 'en', label: 'English' },
          { value: 'pl', label: 'Polski' },
          { value: 'es', label: 'Español' },
          { value: 'de', label: 'Deutsch' },
          { value: 'fr', label: 'Français' },
        ]}
        onChange={(value) => updateSetting('language', value as 'en' | 'pl' | 'es' | 'de' | 'fr')}
      />
      <UIVersionToggle />
    </SettingsSection>
  );
}

interface PrivacySectionProps {
  settings: UserSettings;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
}

export function PrivacySection({ settings, updateSetting }: PrivacySectionProps) {
  return (
    <SettingsSection title="Privacy" description="Control your privacy and data visibility">
      <SelectSetting
        id="profileVisibility"
        label="Profile Visibility"
        description="Who can see your profile"
        value={settings.profileVisibility}
        options={[
          { value: 'public', label: 'Public' },
          { value: 'contacts', label: 'Contacts Only' },
          { value: 'private', label: 'Private' },
        ]}
        onChange={(value) =>
          updateSetting('profileVisibility', value as 'public' | 'private' | 'contacts')
        }
      />
      <ToggleSetting
        id="showEmail"
        label="Show Email"
        description="Display your email on your public profile"
        checked={settings.showEmail}
        onChange={(checked) => updateSetting('showEmail', checked)}
      />
      <ToggleSetting
        id="showLastSeen"
        label="Show Last Seen"
        description="Let others see when you were last active"
        checked={settings.showLastSeen}
        onChange={(checked) => updateSetting('showLastSeen', checked)}
      />
    </SettingsSection>
  );
}
