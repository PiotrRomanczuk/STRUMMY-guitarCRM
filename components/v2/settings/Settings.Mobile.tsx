'use client';

import { motion } from 'framer-motion';
import { Bell, Palette, Shield, Key, Link2, Save, RotateCcw } from 'lucide-react';
import { staggerContainer, listItem } from '@/lib/animations/variants';
import { MobilePageShell } from '@/components/v2/primitives/MobilePageShell';
import { UIVersionToggle } from '@/components/v2/settings/UIVersionToggle';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SettingsGroup, SettingsRow, ToggleRow } from './Settings.Primitives';
import type { SettingsV2Props } from './Settings';

export function SettingsMobile({
  settings,
  hasChanges,
  saving,
  isGoogleConnected,
  updateSetting,
  onSave,
  onReset,
}: SettingsV2Props) {
  return (
    <MobilePageShell title="Settings" showBack>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        <motion.div variants={listItem}>
          <UIVersionToggle />
        </motion.div>

        {/* Notifications */}
        <motion.div variants={listItem}>
          <SettingsGroup title="Notifications">
            <ToggleRow
              icon={<Bell className="h-4 w-4 text-primary" />}
              label="Email Notifications"
              description="Receive updates via email"
              checked={settings.emailNotifications}
              onChange={(v) => updateSetting('emailNotifications', v)}
            />
            <ToggleRow
              icon={<Bell className="h-4 w-4 text-primary" />}
              label="Push Notifications"
              description="Browser push notifications"
              checked={settings.pushNotifications}
              onChange={(v) => updateSetting('pushNotifications', v)}
            />
            <ToggleRow
              icon={<Bell className="h-4 w-4 text-primary" />}
              label="Lesson Reminders"
              description="Get reminded before lessons"
              checked={settings.lessonReminders}
              onChange={(v) => updateSetting('lessonReminders', v)}
            />
          </SettingsGroup>
        </motion.div>

        {/* Appearance */}
        <motion.div variants={listItem}>
          <SettingsGroup title="Appearance">
            <SettingsRow
              icon={<Palette className="h-4 w-4 text-primary" />}
              label="Theme"
              trailing={
                <select
                  value={settings.theme}
                  onChange={(e) => updateSetting('theme', e.target.value as 'light' | 'dark' | 'system')}
                  className="text-sm bg-transparent text-foreground border border-border rounded-md px-2 py-1.5 text-right focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              }
            />
            <SettingsRow
              icon={<Palette className="h-4 w-4 text-primary" />}
              label="Language"
              trailing={
                <select
                  value={settings.language}
                  onChange={(e) => updateSetting('language', e.target.value as 'en' | 'pl' | 'es' | 'de' | 'fr')}
                  className="text-sm bg-transparent text-foreground border border-border rounded-md px-2 py-1.5 text-right focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="en">English</option>
                  <option value="pl">Polski</option>
                  <option value="es">Espanol</option>
                  <option value="de">Deutsch</option>
                  <option value="fr">Francais</option>
                </select>
              }
            />
          </SettingsGroup>
        </motion.div>

        {/* Privacy */}
        <motion.div variants={listItem}>
          <SettingsGroup title="Privacy">
            <ToggleRow
              icon={<Shield className="h-4 w-4 text-primary" />}
              label="Show Email"
              description="Display email on profile"
              checked={settings.showEmail}
              onChange={(v) => updateSetting('showEmail', v)}
            />
            <ToggleRow
              icon={<Shield className="h-4 w-4 text-primary" />}
              label="Show Last Seen"
              description="Let others see activity"
              checked={settings.showLastSeen}
              onChange={(v) => updateSetting('showLastSeen', v)}
            />
          </SettingsGroup>
        </motion.div>

        {/* Integrations */}
        <motion.div variants={listItem}>
          <SettingsGroup title="Integrations">
            <SettingsRow
              icon={<Link2 className="h-4 w-4 text-primary" />}
              label="Google Calendar"
              trailing={
                <span
                  className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full',
                    isGoogleConnected
                      ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {isGoogleConnected ? 'Connected' : 'Disconnected'}
                </span>
              }
            />
            <SettingsRow
              icon={<Key className="h-4 w-4 text-primary" />}
              label="API Keys"
              description="Manage your API keys"
              onClick={() => {/* Navigate to API keys */}}
            />
          </SettingsGroup>
        </motion.div>

        {/* Save actions */}
        {hasChanges && (
          <motion.div variants={listItem} className="flex gap-3 pt-2">
            <Button onClick={onSave} disabled={saving} className="flex-1 min-h-[44px]">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button variant="outline" onClick={onReset} disabled={saving} className="min-h-[44px]">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </motion.div>
    </MobilePageShell>
  );
}
