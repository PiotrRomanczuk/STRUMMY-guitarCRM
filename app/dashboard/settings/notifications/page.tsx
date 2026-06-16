import { NotificationPreferences } from '@/components/settings/NotificationPreferences';

export const metadata = {
  title: 'Notification preferences',
};

/**
 * Notification preferences (spec 08). Wires the built `NotificationPreferences`
 * component to `notification_preferences` via its server-action-backed hook.
 *
 * Bucket-A note: `notification_preferences` is restored to prod in Phase 0.1.
 * Until then the action returns an error, which the component surfaces as an
 * inline alert (no silent failure) rather than crashing.
 */
export default function Page() {
  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
          Choose which updates you receive and how.
        </p>
      </div>
      <NotificationPreferences />
    </div>
  );
}
