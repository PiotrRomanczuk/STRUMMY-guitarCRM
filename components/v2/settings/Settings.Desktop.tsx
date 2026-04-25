'use client';

import {
  Bell,
  Palette,
  Shield,
  Key,
  Link2,
  Save,
  RotateCcw,
} from 'lucide-react';
import { UIVersionToggle } from '@/components/v2/settings/UIVersionToggle';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { SettingsV2Props } from './Settings';

interface SectionCardProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function SectionCard({ icon, title, children }: SectionCardProps) {
  return (
    <div className="bg-card border border-border rounded-[10px] p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-[.14em] font-medium">Section</p>
          <h3 className="font-serif text-xl font-normal tracking-[-0.01em]">{title}</h3>
        </div>
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

interface ToggleFieldProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleField({ label, description, checked, onChange }: ToggleFieldProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[.14em] font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export default function SettingsDesktop({
  settings,
  hasChanges,
  saving,
  isGoogleConnected,
  updateSetting,
  onSave,
  onReset,
}: SettingsV2Props) {
  return (
    <div className="max-w-4xl mx-auto px-8 py-10 space-y-8">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[.16em] text-muted-foreground">Preferences</p>
        <h1 className="font-serif font-normal text-[34px] tracking-[-0.02em] leading-none mt-1">Settings</h1>
        <p className="text-muted-foreground text-[13px] mt-1.5">
          Manage your preferences and account settings
        </p>
      </div>

      <UIVersionToggle />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard icon={<Bell className="h-5 w-5 text-primary" />} title="Notifications">
          <ToggleField
            label="Email Notifications"
            description="Receive updates and news via email"
            checked={settings.emailNotifications}
            onChange={(v) => updateSetting('emailNotifications', v)}
          />
          <ToggleField
            label="Push Notifications"
            description="Browser push notifications"
            checked={settings.pushNotifications}
            onChange={(v) => updateSetting('pushNotifications', v)}
          />
          <ToggleField
            label="Lesson Reminders"
            description="Reminders before scheduled lessons"
            checked={settings.lessonReminders}
            onChange={(v) => updateSetting('lessonReminders', v)}
          />
        </SectionCard>

        <SectionCard icon={<Palette className="h-5 w-5 text-primary" />} title="Appearance">
          <div className="space-y-2">
            <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-[.14em] font-medium">Theme</label>
            <select
              value={settings.theme}
              onChange={(e) => updateSetting('theme', e.target.value as 'light' | 'dark' | 'system')}
              className="w-full px-3 py-2 text-sm border border-border bg-background rounded-[8px]"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System Default</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-[.14em] font-medium">Language</label>
            <select
              value={settings.language}
              onChange={(e) => updateSetting('language', e.target.value as 'en' | 'pl' | 'es' | 'de' | 'fr')}
              className="w-full px-3 py-2 text-sm border border-border bg-background rounded-[8px]"
            >
              <option value="en">English</option>
              <option value="pl">Polski</option>
              <option value="es">Espanol</option>
              <option value="de">Deutsch</option>
              <option value="fr">Francais</option>
            </select>
          </div>
        </SectionCard>

        <SectionCard icon={<Shield className="h-5 w-5 text-primary" />} title="Privacy">
          <ToggleField
            label="Show Email"
            description="Display email on your public profile"
            checked={settings.showEmail}
            onChange={(v) => updateSetting('showEmail', v)}
          />
          <ToggleField
            label="Show Last Seen"
            description="Let others see when you were last active"
            checked={settings.showLastSeen}
            onChange={(v) => updateSetting('showLastSeen', v)}
          />
        </SectionCard>

        <SectionCard icon={<Link2 className="h-5 w-5 text-primary" />} title="Integrations">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[.14em] font-medium">Google Calendar</p>
              <p className="text-xs text-muted-foreground mt-0.5">Sync your lesson schedule</p>
            </div>
            <span
              className={cn(
                'text-xs font-medium px-2.5 py-0.5 rounded-full border',
                isGoogleConnected
                  ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
                  : 'bg-muted text-muted-foreground border-border'
              )}
            >
              {isGoogleConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[.14em] font-medium">API Keys</p>
              <p className="text-xs text-muted-foreground mt-0.5">Manage external API access</p>
            </div>
            <Button variant="outline" size="sm">
              <Key className="h-3.5 w-3.5 mr-1.5" />
              Manage
            </Button>
          </div>
        </SectionCard>
      </div>

      {hasChanges && (
        <div className="flex gap-3 pt-4 border-t border-border">
          <Button onClick={onSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button variant="outline" onClick={onReset} disabled={saving}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
        </div>
      )}
    </div>
  );
}
