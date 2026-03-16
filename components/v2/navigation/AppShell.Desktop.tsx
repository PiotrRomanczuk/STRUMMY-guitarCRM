'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Guitar, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getMenuGroups } from '@/components/navigation/menuConfig';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { NotificationBell } from '@/components/notifications';
import { Toaster } from 'sonner';

interface AppShellDesktopV2Props {
  children: React.ReactNode;
  user: { id?: string; email?: string } | null;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
}

function isActive(pathname: string | null, path: string): boolean {
  if (!pathname) return false;
  return path === '/dashboard'
    ? pathname === '/dashboard'
    : pathname.startsWith(path);
}

export default function AppShellDesktopV2({
  children, user, isAdmin, isTeacher, isStudent,
}: AppShellDesktopV2Props) {
  const pathname = usePathname();
  const groups = getMenuGroups({ isAdmin, isTeacher, isStudent });

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/sign-in';
  };

  const roleLabel = isAdmin ? 'Admin' : isTeacher ? 'Teacher' : isStudent ? 'Student' : 'User';

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-60 bg-card border-r border-border flex flex-col z-40">
        {/* Logo */}
        <Link href="/dashboard" className="h-14 flex items-center gap-2.5 px-4 border-b border-border shrink-0 hover:bg-muted/50 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Guitar className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold text-sm leading-tight">Strummy</h1>
            <p className="text-[10px] text-muted-foreground leading-tight">{roleLabel}</p>
          </div>
        </Link>

        {/* Navigation groups */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-3 mb-1">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(pathname, item.path);
                  return (
                    <Link
                      key={item.id}
                      href={item.path}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                        active
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                      )}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-3 space-y-1.5 shrink-0">
          <div className="flex items-center gap-2 px-2">
            <NotificationBell userId={user?.id} />
            <ModeToggle />
          </div>
          <button
            onClick={handleSignOut}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm w-full',
              'text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors',
            )}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-60 flex-1 min-h-screen bg-background p-6 lg:p-8">
        {children}
      </main>
      <Toaster />
    </div>
  );
}
