'use client';

import {
  Users,
  Music,
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  Settings,
  LogOut,
  Guitar,
  BarChart,
  FileText,
  Music2,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { roleChipsLabel } from '@/lib/roles/roleLabel';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { DatabaseStatus } from '@/components/debug/DatabaseStatus';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NotificationBell } from '@/components/notifications';

interface HorizontalNavProps {
  user: { id?: string; email?: string } | null;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
}

export function HorizontalNav({ user, isAdmin, isTeacher, isStudent }: HorizontalNavProps) {
  const pathname = usePathname();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/sign-in';
  };

  if (!user) return null;

  const getMenuItems = () => {
    const items = [{ id: 'home', label: 'Home', icon: LayoutDashboard, path: '/dashboard' }];

    if (isAdmin || isTeacher) {
      items.push(
        { id: 'songs', label: 'Songs', icon: Music, path: '/dashboard/songs' },
        { id: 'lessons', label: 'Lessons', icon: BookOpen, path: '/dashboard/lessons' },
        {
          id: 'assignments',
          label: 'Assignments',
          icon: ClipboardList,
          path: '/dashboard/assignments',
        },
        { id: 'users', label: 'Users', icon: Users, path: '/dashboard/users' },
        { id: 'skills', label: 'Skills', icon: Zap, path: '/dashboard/skills' },
        { id: 'cohorts', label: 'Cohorts', icon: Users, path: '/dashboard/cohorts' },
        {
          id: 'spotify-matches',
          label: 'Spotify Matches',
          icon: Music2,
          path: '/dashboard/admin/spotify-matches',
        },
        {
          id: 'song-stats',
          label: 'Song Stats',
          icon: BarChart,
          path: '/dashboard/admin/stats/songs',
        },
        {
          id: 'lesson-stats',
          label: 'Lesson Stats',
          icon: BarChart,
          path: '/dashboard/admin/stats/lessons',
        },
        { id: 'logs', label: 'Activity Logs', icon: FileText, path: '/dashboard/logs' }
      );
    } else if (isStudent) {
      items.push(
        { id: 'my-songs', label: 'My Songs', icon: Music, path: '/dashboard/songs' },
        { id: 'my-lessons', label: 'My Lessons', icon: BookOpen, path: '/dashboard/lessons' },
        {
          id: 'my-assignments',
          label: 'My Assignments',
          icon: ClipboardList,
          path: '/dashboard/assignments',
        },
        { id: 'my-stats', label: 'My Stats', icon: BarChart, path: '/dashboard/stats' }
      );
    }
    return items;
  };

  const menuItems = getMenuItems();

  // Split into primary nav items (always visible) and secondary (in "More" dropdown on tablet)
  const secondaryIds = new Set([
    'skills',
    'cohorts',
    'spotify-matches',
    'song-stats',
    'lesson-stats',
    'logs',
  ]);
  const primaryItems = menuItems.filter((item) => !secondaryIds.has(item.id));
  const secondaryItems = menuItems.filter((item) => secondaryIds.has(item.id));
  const hasSecondaryActive = secondaryItems.some(
    (item) =>
      pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path))
  );

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-background border-b border-border z-50 pt-[env(safe-area-inset-top)]">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Guitar className="w-5 h-5 text-primary" />
          </div>
          <div className="hidden sm:block">
            <h1 className="font-semibold text-sm">GuitarStudio</h1>
            <p className="text-xs text-muted-foreground">
              {roleChipsLabel(isAdmin, isTeacher, isStudent)}
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-1 flex-1 px-8">
          {primaryItems.map((item) => {
            const isActive =
              pathname === item.path ||
              (item.path !== '/dashboard' && pathname.startsWith(item.path));
            return (
              <Link
                key={item.id}
                href={item.path}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="w-4 h-4" />
                <span className="hidden xl:inline">{item.label}</span>
              </Link>
            );
          })}

          {/* "More" dropdown for admin/secondary items */}
          {secondaryItems.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    hasSecondaryActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <BarChart className="w-4 h-4" />
                  <span className="hidden xl:inline">More</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel>Admin Tools</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {secondaryItems.map((item) => {
                  const isActive =
                    pathname === item.path ||
                    (item.path !== '/dashboard' && pathname.startsWith(item.path));
                  return (
                    <DropdownMenuItem key={item.id} asChild>
                      <Link
                        href={item.path}
                        className={cn(
                          'flex items-center gap-2 cursor-pointer',
                          isActive && 'text-primary font-medium'
                        )}
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          <DatabaseStatus variant="inline" className="hidden md:flex" />
          <NotificationBell userId={user?.id} />
          <ModeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">{user.email?.split('@')[0]}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="cursor-pointer">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
