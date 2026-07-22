'use client';

import { Shield, GraduationCap, User } from 'lucide-react';
import { useDbConnection } from '@/lib/supabase/useDbConnection';
import { Button } from '@/components/ui/button';

// Seeded dev-only accounts (see reference: local Supabase on uwh). These accounts
// exist ONLY in the development database, so shipping the strings is harmless — the
// component also renders nothing unless the app is actually connected to dev.
const DEV_PASSWORD = 'DevTest123!';
const DEV_ACCOUNTS = [
  { role: 'Admin', email: 'admin@dev.local', Icon: Shield },
  { role: 'Teacher', email: 'teacher@dev.local', Icon: GraduationCap },
  { role: 'Student', email: 'student@dev.local', Icon: User },
] as const;

interface DevQuickLoginProps {
  onLogin: (email: string, password: string) => void;
  disabled?: boolean;
}

/** Three one-click role logins, shown only when connected to the dev database. */
export function DevQuickLogin({ onLogin, disabled }: DevQuickLoginProps) {
  const db = useDbConnection();
  if (db?.kind !== 'dev') return null;

  return (
    <div className="mb-4 rounded-lg border border-warning/30 bg-warning/5 p-3">
      <p className="mb-2 text-center text-[0.7rem] font-medium uppercase tracking-wide text-warning">
        Dev quick login
      </p>
      <div className="grid grid-cols-3 gap-2">
        {DEV_ACCOUNTS.map(({ role, email, Icon }) => (
          <Button
            key={role}
            type="button"
            variant="outline"
            disabled={disabled}
            data-testid={`dev-login-${role.toLowerCase()}`}
            onClick={() => onLogin(email, DEV_PASSWORD)}
            className="flex h-auto flex-col gap-1 border-warning/30 py-2 text-warning hover:bg-warning/10 hover:text-warning"
          >
            <Icon className="h-4 w-4" aria-hidden />
            <span className="text-xs font-medium">{role}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
